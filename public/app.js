/**
 * 冬至暖心祝福留言板 - 交互逻辑
 * Winter Solstice Warm Blessings Message Board
 */

// ===== 常量配置 =====
const CONFIG = {
    API_BASE: '/api',
    TOAST_DURATION: 3000,
    CARD_AUTO_SHOW_INTERVAL: 15000, // 15秒自动展示一个祝福
    DUMPLING_POSITIONS: [
        { left: '10%', top: '20%' },
        { left: '30%', top: '40%' },
        { left: '50%', top: '15%' },
        { left: '70%', top: '35%' },
        { left: '20%', top: '55%' },
        { left: '45%', top: '60%' },
        { left: '65%', top: '50%' },
        { left: '15%', top: '35%' },
        { left: '55%', top: '25%' },
        { left: '75%', top: '20%' },
        { left: '25%', top: '65%' },
        { left: '60%', top: '70%' },
        { left: '35%', top: '30%' },
        { left: '80%', top: '45%' },
        { left: '5%', top: '50%' },
        { left: '40%', top: '50%' },
        { left: '85%', top: '25%' },
        { left: '10%', top: '65%' },
        { left: '90%', top: '55%' },
        { left: '50%', top: '40%' }
    ],
    SUCCESS_MESSAGES: [
        "这只饺子，已经有人记住了",
        "锅里又多了一份温暖",
        "冬至的温度，上升了一点点"
    ],
    PROGRESS_TEXTS: {
        cold: "锅还在慢慢热",
        warm: "锅里开始热闹了",
        hot: "这是一锅团圆",
        finale: "这一锅，是我们一起包的 ✨"
    }
};

// ===== 状态管理 =====
let state = {
    blessings: [],
    count: 0,
    isSubmitting: false,
    finaleTriggered: false
};

// ===== DOM 元素 =====
const elements = {
    blessingInput: document.getElementById('blessingInput'),
    charCount: document.getElementById('charCount'),
    submitBtn: document.getElementById('submitBtn'),
    dumplingsContainer: document.getElementById('dumplingsContainer'),
    dumplingCount: document.getElementById('dumplingCount'),
    progressText: document.getElementById('progressText'),
    successToast: document.getElementById('successToast'),
    toastMessage: document.getElementById('toastMessage'),
    blessingCard: document.getElementById('blessingCard'),
    cardText: document.getElementById('cardText'),
    cardClose: document.getElementById('cardClose'),
    finaleOverlay: document.getElementById('finaleOverlay'),
    steamLayer: document.querySelector('.steam-layer')
};

// ===== API 调用 =====
const api = {
    async getBlessings() {
        const response = await fetch(`${CONFIG.API_BASE}/blessings`);
        if (!response.ok) throw new Error('Failed to fetch blessings');
        return response.json();
    },

    async getCount() {
        const response = await fetch(`${CONFIG.API_BASE}/blessings/count`);
        if (!response.ok) throw new Error('Failed to fetch count');
        return response.json();
    },

    async createBlessing(content) {
        const response = await fetch(`${CONFIG.API_BASE}/blessings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to create blessing');
        return response.json();
    }
};

// ===== 雪花效果 =====
function initSnow() {
    const container = document.getElementById('snowContainer');
    if (!container) return;

    setInterval(() => {
        if (document.querySelectorAll('.snowflake').length > 30) return;

        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = Math.random() > 0.5 ? '❄' : '❅';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (8 + Math.random() * 8) + 's';
        snowflake.style.opacity = 0.3 + Math.random() * 0.4;
        snowflake.style.fontSize = (0.5 + Math.random() * 1) + 'rem';
        container.appendChild(snowflake);

        setTimeout(() => snowflake.remove(), 16000);
    }, 500);
}

// ===== 工具函数 =====
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getProgressText(count) {
    if (count >= 50) return CONFIG.PROGRESS_TEXTS.finale;
    if (count >= 30) return CONFIG.PROGRESS_TEXTS.hot;
    if (count >= 10) return CONFIG.PROGRESS_TEXTS.warm;
    return CONFIG.PROGRESS_TEXTS.cold;
}

// ===== 饺子管理 =====
function createDumplingElement(blessing, position, isNew = false) {
    const dumpling = document.createElement('div');
    dumpling.className = `dumpling${isNew ? ' dropping' : ''}`;
    dumpling.style.left = position.left;
    dumpling.style.top = position.top;
    dumpling.style.animationDelay = `${randomBetween(0, 8)}s`;
    dumpling.style.animationDuration = `${randomBetween(6, 10)}s`;
    dumpling.dataset.blessingId = blessing.id;
    dumpling.dataset.content = blessing.content;

    dumpling.innerHTML = '<div class="dumpling-body"></div>';

    // 点击显示祝福
    dumpling.addEventListener('click', () => showBlessingCard(blessing.content));

    return dumpling;
}

function addDumplingToContainer(blessing, isNew = false) {
    const existingDumplings = elements.dumplingsContainer.querySelectorAll('.dumpling');
    const positionIndex = existingDumplings.length % CONFIG.DUMPLING_POSITIONS.length;

    // 稍微随机偏移位置
    const basePosition = CONFIG.DUMPLING_POSITIONS[positionIndex];
    const position = {
        left: `calc(${basePosition.left} + ${randomBetween(-5, 5)}%)`,
        top: `calc(${basePosition.top} + ${randomBetween(-5, 5)}%)`
    };

    const dumpling = createDumplingElement(blessing, position, isNew);
    elements.dumplingsContainer.appendChild(dumpling);

    // 如果是新饺子，添加水波纹
    if (isNew) {
        createRipple(position);

        // 动画结束后移除 dropping 类
        setTimeout(() => {
            dumpling.classList.remove('dropping');
        }, 800);
    }
}

function createRipple(position) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = position.left;
    ripple.style.top = position.top;

    elements.dumplingsContainer.appendChild(ripple);

    // 动画结束后移除
    setTimeout(() => ripple.remove(), 1000);
}

// ===== 祝福卡片 =====
function showBlessingCard(content) {
    elements.cardText.textContent = content;
    elements.blessingCard.classList.add('show');
}

function hideBlessingCard() {
    elements.blessingCard.classList.remove('show');
}

// ===== Toast 提示 =====
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.successToast.classList.add('show');

    setTimeout(() => {
        elements.successToast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// ===== 进度更新 =====
function updateProgress(count) {
    state.count = count;
    elements.dumplingCount.textContent = count;
    elements.progressText.textContent = getProgressText(count);

    // 终局效果
    if (count >= 50 && !state.finaleTriggered) {
        triggerFinale();
    }
}

function triggerFinale() {
    state.finaleTriggered = true;
    document.body.classList.add('warm-finale');
    elements.finaleOverlay.classList.add('active');

    // 3秒后隐藏终局文字
    setTimeout(() => {
        elements.finaleOverlay.classList.remove('active');
    }, 4000);
}

// ===== 提交祝福 =====
async function handleSubmit() {
    const content = elements.blessingInput.value.trim();

    if (!content) {
        elements.blessingInput.focus();
        return;
    }

    if (state.isSubmitting) return;

    state.isSubmitting = true;
    elements.submitBtn.disabled = true;

    try {
        const result = await api.createBlessing(content);

        // 清空输入
        elements.blessingInput.value = '';
        elements.charCount.textContent = '0';

        // 添加饺子（带动画）
        addDumplingToContainer(result.blessing, true);

        // 更新进度
        updateProgress(result.totalCount);

        // 显示成功提示
        showToast(getRandomItem(CONFIG.SUCCESS_MESSAGES));

    } catch (error) {
        console.error('提交失败:', error);
        showToast('提交失败，请稍后重试');
    } finally {
        state.isSubmitting = false;
        elements.submitBtn.disabled = false;
    }
}

// ===== 自动展示祝福 =====
function startAutoShowBlessings() {
    setInterval(() => {
        if (state.blessings.length > 0 && !elements.blessingCard.classList.contains('show')) {
            const randomBlessing = getRandomItem(state.blessings);
            showBlessingCard(randomBlessing.content);

            // 5秒后自动关闭
            setTimeout(() => {
                hideBlessingCard();
            }, 5000);
        }
    }, CONFIG.CARD_AUTO_SHOW_INTERVAL);
}

// ===== 事件绑定 =====
function bindEvents() {
    // 输入字数统计
    elements.blessingInput.addEventListener('input', () => {
        elements.charCount.textContent = elements.blessingInput.value.length;
    });

    // 输入时蒸汽减弱
    elements.blessingInput.addEventListener('focus', () => {
        elements.steamLayer.classList.add('dimmed');
    });

    elements.blessingInput.addEventListener('blur', () => {
        elements.steamLayer.classList.remove('dimmed');
    });

    // 提交按钮
    elements.submitBtn.addEventListener('click', handleSubmit);

    // 回车提交（Shift+Enter 换行）
    elements.blessingInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    // 关闭祝福卡片
    elements.cardClose.addEventListener('click', hideBlessingCard);
    elements.blessingCard.addEventListener('click', (e) => {
        if (e.target === elements.blessingCard) {
            hideBlessingCard();
        }
    });
}

// ===== 初始化 =====
async function init() {
    bindEvents();

    try {
        // 加载现有祝福
        const blessings = await api.getBlessings();
        state.blessings = blessings;

        // 渲染饺子（超过20个时随机展示20个）
        let displayBlessings = blessings;
        if (blessings.length > 20) {
            // 随机打乱并取前20个
            displayBlessings = [...blessings].sort(() => 0.5 - Math.random()).slice(0, 20);
        }

        displayBlessings.forEach(blessing => {
            addDumplingToContainer(blessing, false);
        });

        // 获取总数
        const { count } = await api.getCount();
        updateProgress(count);

        // 启动雪花效果
        initSnow();

    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
