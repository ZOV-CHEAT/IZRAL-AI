const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const apiKeyInput = document.getElementById('apiKey');
const providerSelect = document.getElementById('providerSelect');
const modelSelect = document.getElementById('modelSelect');
const tokenCount = document.getElementById('tokenCount');
const messageCount = document.getElementById('messageCount');
const statusText = document.getElementById('statusText');
const customModelInput = document.getElementById('customModel');

let totalTokens = 0;
let messageCounter = 1;
let currentProvider = 'openai';

const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        url: 'https://api.openai.com/v1/chat/completions',
        models: [
            {id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo'},
            {id: 'gpt-4', name: 'GPT-4'},
            {id: 'gpt-4-turbo', name: 'GPT-4 Turbo'}
        ],
        keySite: 'https://platform.openai.com'
    },
    openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        models: [
            {id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo'},
            {id: 'openai/gpt-4', name: 'GPT-4'},
            {id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B'},
            {id: 'google/gemini-pro', name: 'Gemini Pro'},
            {id: 'anthropic/claude-2', name: 'Claude 2'},
            {id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat'},
            {id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder'},
            {id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B'},
            {id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B'}
        ],
        keySite: 'https://openrouter.ai'
    },
    google: {
        name: 'Google AI',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        models: [
            {id: 'gemini-pro', name: 'Gemini Pro'}
        ],
        keySite: 'https://makersuite.google.com'
    },
    anthropic: {
        name: 'Anthropic',
        url: 'https://api.anthropic.com/v1/messages',
        models: [
            {id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku'},
            {id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet'}
        ],
        keySite: 'https://console.anthropic.com'
    },
    deepseek: {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/v1/chat/completions',
        models: [
            {id: 'deepseek-chat', name: 'DeepSeek Chat'},
            {id: 'deepseek-coder', name: 'DeepSeek Coder'}
        ],
        keySite: 'https://platform.deepseek.com'
    },
    qwen: {
        name: 'Qwen (Aliyun)',
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        models: [
            {id: 'qwen-turbo', name: 'Qwen Turbo'},
            {id: 'qwen-plus', name: 'Qwen Plus'},
            {id: 'qwen-max', name: 'Qwen Max'}
        ],
        keySite: 'https://dashscope.console.aliyun.com'
    },
    nemotron: {
        name: 'Nemotron (NVIDIA)',
        url: 'https://integrate.api.nvidia.com/v1/chat/completions',
        models: [
            {id: 'nvidia/nemotron-3-8b-instruct', name: 'Nemotron 3 8B'},
            {id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B'}
        ],
        keySite: 'https://build.nvidia.com'
    }
};

function selectProvider() {
    currentProvider = providerSelect.value;
    statusText.textContent = `Готов (${PROVIDERS[currentProvider].name})`;
    updateModels();
    customModelInput.style.display = 'none';
    customModelInput.value = '';
}

function updateModels() {
    const provider = PROVIDERS[currentProvider];
    const models = [
        ...provider.models,
        {id: 'custom', name: '✏️ Своя модель...'}
    ];
    
    modelSelect.innerHTML = models.map(model => 
        `<option value="${model.id}">${model.name}</option>`
    ).join('');
}

modelSelect.addEventListener('change', function() {
    if (this.value === 'custom') {
        customModelInput.style.display = 'block';
        customModelInput.focus();
    } else {
        customModelInput.style.display = 'none';
        customModelInput.value = '';
    }
});

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    let content = text;
    if (!isUser) {
        content = formatCodeBlocks(text);
        messageCounter++;
        messageCount.textContent = messageCounter;
    }
    
    messageDiv.innerHTML = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    if (!isUser) {
        setTimeout(() => {
            const codeBlocks = messageDiv.querySelectorAll('.code-block');
            codeBlocks.forEach(block => {
                const copyBtn = block.querySelector('.copy-btn');
                if (copyBtn) {
                    copyBtn.onclick = () => {
                        const code = block.querySelector('code').textContent;
                        navigator.clipboard.writeText(code);
                        const originalText = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<span>✓ Скопировано</span>';
                        setTimeout(() => copyBtn.innerHTML = originalText, 2000);
                    };
                }
            });
        }, 100);
    }
}

function formatCodeBlocks(text) {
    let result = text;
    
    const codePatterns = [
        {lang: 'javascript', pattern: /```(javascript|js)\s*([\s\S]*?)```/g},
        {lang: 'python', pattern: /```(python|py)\s*([\s\S]*?)```/g},
        {lang: 'html', pattern: /```(html)\s*([\s\S]*?)```/g},
        {lang: 'css', pattern: /```(css)\s*([\s\S]*?)```/g},
        {lang: 'java', pattern: /```(java)\s*([\s\S]*?)```/g},
        {lang: 'cpp', pattern: /```(cpp|c\+\+)\s*([\s\S]*?)```/g},
        {lang: 'bash', pattern: /```(bash|sh)\s*([\s\S]*?)```/g},
        {lang: 'sql', pattern: /```(sql)\s*([\s\S]*?)```/g},
        {lang: 'generic', pattern: /```(\w+)?\s*([\s\S]*?)```/g}
    ];
    
    codePatterns.forEach(({lang, pattern}) => {
        result = result.replace(pattern, (match, langName, code) => {
            const language = langName || lang;
            return `<div class="code-block">
                <div class="code-header">
                    <div class="code-language">${language.toUpperCase()}</div>
                    <button class="copy-btn">📋 Копировать</button>
                </div>
                <pre><code>${escapeHtml(code.trim())}</code></pre>
            </div>`;
        });
    });
    
    result = result.replace(/\n/g, '<br>');
    result = result.replace(/\t/g, '    ');
    result = result.replace(/ {4}/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    result = result.replace(/ {2}/g, '&nbsp;&nbsp;');
    
    const inlineCodePattern = /`([^`]+)`/g;
    result = result.replace(inlineCodePattern, '<code class="inline-code">$1</code>');
    
    return result;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function getModel() {
    const selected = modelSelect.value;
    if (selected === 'custom') {
        const custom = customModelInput.value.trim();
        if (!custom) throw new Error('Введите название модели');
        return custom;
    }
    return selected;
}

async function callAPI(prompt) {
    const apiKey = apiKeyInput.value.trim();
    const provider = PROVIDERS[currentProvider];
    let model = getModel();
    
    if (!apiKey) throw new Error('Вставь API ключ');
    
    statusText.textContent = `${provider.name} думает...`;
    
    let url = provider.url;
    let headers = { 'Content-Type': 'application/json' };
    let body = {};
    
    if (currentProvider === 'openrouter') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'AI Chat';
        body = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        };
    }
    else if (currentProvider === 'openai' || currentProvider === 'deepseek' || currentProvider === 'nemotron') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        };
    }
    else if (currentProvider === 'google') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        body = {
            contents: [{ parts: [{ text: prompt }] }]
        };
    }
    else if (currentProvider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
            model: model,
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
        };
    }
    else if (currentProvider === 'qwen') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
            model: model,
            input: {
                messages: [{ role: 'user', content: prompt }]
            },
            parameters: {
                result_format: 'message'
            }
        };
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error('Неверный API ключ');
        if (response.status === 429) throw new Error('Лимит токенов исчерпан');
        throw new Error(error.error?.message || `Ошибка ${response.status}`);
    }
    
    const data = await response.json();
    
    if (currentProvider === 'openrouter' || currentProvider === 'openai' || 
        currentProvider === 'deepseek' || currentProvider === 'nemotron') {
        totalTokens += data.usage?.total_tokens || 0;
        tokenCount.textContent = totalTokens;
        return data.choices[0].message.content;
    }
    else if (currentProvider === 'google') {
        return data.candidates[0].content.parts[0].text;
    }
    else if (currentProvider === 'anthropic') {
        return data.content[0].text;
    }
    else if (currentProvider === 'qwen') {
        return data.output.choices[0].message.content;
    }
    
    return 'Ошибка: неизвестный формат ответа';
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    userInput.value = '';
    sendButton.disabled = true;
    userInput.style.height = '60px';
    
    showTyping();
    
    try {
        const aiResponse = await callAPI(message);
        hideTyping();
        addMessage(aiResponse, false);
        statusText.textContent = `Готов (${PROVIDERS[currentProvider].name})`;
    } catch (error) {
        hideTyping();
        addMessage(`<span style="color:#ff5555">❌ Ошибка ${PROVIDERS[currentProvider].name}:</span> ${error.message}`, false);
        statusText.textContent = 'Ошибка';
    }
    
    sendButton.disabled = false;
    userInput.focus();
}

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) sendMessage();
    }
});

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

updateModels();
userInput.focus();
