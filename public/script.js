const CONFIG = {
    getParent: () => {
        const hostname = window.location.hostname;
        const parents = [hostname];
        // Always include localhost/127.0.0.1 for local testing flexibility
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            parents.push('localhost');
            parents.push('127.0.0.1');
        }
        return parents;
    }
};

const TRANSLATIONS = {
    "en": {
        "savedGroups": "Saved Groups",
        "saveGroupBtn": "Save current group",
        "settingsTitle": "Settings",
        "themeColor": "Theme Color",
        "startMuted": "Start streams muted",
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "confirmDelete": "Are you sure you want to delete this group?",
        "editGroup": "Edit Group",
        "saveChanges": "Save Changes",
        "addStreamerPlaceholder": "Add streamer...",
        "enterName": "Enter Name",
        "welcomeTitle": "Welcome to MultiTwitch",
        "welcomeText": "Add a streamer in the sidebar to get started.",
        "helpTitle": "Guide",
        "helpIntro": "Welcome to MultiTwitch! Watch multiple streams, chat, and save your favorite groups.",
        "howToAdd": "How to add a stream?",
        "howToAddList": "<li>Type streamer name (e.g. <b>riotgames</b>)</li><li>YouTube link (e.g. <b>youtube.com/watch?v=...</b>)</li><li>Kick link (e.g. <b>kick.com/xqc</b>)</li>",
        "minFeatures": "Features",
        "featuresList": "<li><b>Saved Groups (+):</b> Save your current open streams.</li><li><b>Settings (⚙️):</b> Change theme or mute all.</li><li><b>Chat:</b> Switch between chats in the right panel.</li>",
        "understood": "Got it",
        "toastSaved": "Group Saved!",
        "toastUpdated": "Group updated!",
        "toastSettingsSaved": "Settings saved!",
        "language": "Language"
    },
    "hu": {
        "savedGroups": "Mentett Csoportok",
        "saveGroupBtn": "Jelenlegi csoport mentése",
        "settingsTitle": "Beállítások",
        "themeColor": "Téma Szín",
        "startMuted": "Streamek némítva induljanak",
        "save": "Mentés",
        "cancel": "Mégse",
        "delete": "Törlés",
        "confirmDelete": "Biztosan törölni szeretnéd ezt a csoportot?",
        "editGroup": "Csoport Szerkesztése",
        "saveChanges": "Változások Mentése",
        "addStreamerPlaceholder": "Streamer hozzáadása...",
        "enterName": "Név megadása",
        "welcomeTitle": "Üdvözöl a MultiTwitch",
        "welcomeText": "Adj hozzá egy streamert a sávban a kezdéshez.",
        "helpTitle": "Használati Útmutató",
        "helpIntro": "Üdvözöllek a MultiTwitch-en! Ezzel az alkalmazással egyszerre több streamet is nézhetsz, chatelhetsz, és elmentheted a kedvenc csoportjaidat.",
        "howToAdd": "Hogyan adj hozzá streamet?",
        "howToAddList": "<li>Írd be a streamer nevét (pl. <b>riotgames</b>)</li><li>YouTube link (pl. <b>youtube.com/watch?v=...</b>)</li><li>Kick link (pl. <b>kick.com/xqc</b>)</li>",
        "minFeatures": "Funkciók",
        "featuresList": "<li><b>Mentett Csoportok (+):</b> Mentsd el a jelenleg megnyitott streameket.</li><li><b>Beállítások (⚙️):</b> Válts színtémát vagy némítsd le az összeset.</li><li><b>Chat:</b> A jobb oldali panelen válthatsz a csevegések között.</li>",
        "understood": "Értem",
        "toastSaved": "Csoport Mentve!",
        "toastUpdated": "Csoport frissítve!",
        "toastSettingsSaved": "Beállítások mentve!",
        "language": "Nyelv"
    }
};

class MultiTwitchApp {
    constructor() {
        this.streamers = [];
        this.players = {}; // Track player instances
        this.activeChat = null;

        // DOM Elements
        this.input = document.getElementById('streamInput');
        this.addBtn = document.getElementById('addStreamBtn');
        this.listContainer = document.getElementById('activeStreamsList');
        this.gridContainer = document.getElementById('streamGrid');
        this.emptyState = document.getElementById('emptyState');
        this.chatTabs = document.getElementById('chatTabs'); // Changed from chatSelector
        this.chatContainer = document.getElementById('chatContainer');
        this.chatSidebar = document.getElementById('chatSidebar');
        this.chatToggleBtn = document.getElementById('chatToggle');
        this.closeChatBtn = document.getElementById('closeChatBtn');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.sidebar = document.getElementById('sidebar');

        // New Elements
        this.searchResults = document.getElementById('searchResults');
        this.saveGroupBtn = document.getElementById('saveGroupBtn');
        this.savedGroupsList = document.getElementById('savedGroupsList');

        // Modal Elements
        this.modal = document.getElementById('confirmModal');
        this.modalMessage = document.getElementById('confirmMessage');
        this.confirmBtn = document.getElementById('confirmOk');
        this.cancelBtn = document.getElementById('confirmCancel');

        // Edit Group Modal Elements
        this.editGroupModal = document.getElementById('editGroupModal');
        this.editGroupTitle = document.getElementById('editGroupTitle');
        this.editGroupAddInput = document.getElementById('editGroupAddInput');
        this.editGroupAddBtn = document.getElementById('editGroupAddBtn');
        this.editGroupList = document.getElementById('editGroupList');
        this.editGroupSave = document.getElementById('editGroupSave');
        this.editGroupCancel = document.getElementById('editGroupCancel');

        this.editingGroupIndex = null;
        this.editingStreamers = [];

        // Prompt Elements
        this.promptModal = document.getElementById('promptModal');
        this.promptInput = document.getElementById('promptInput');
        this.promptTitle = document.getElementById('promptTitle');
        this.promptOkBtn = document.getElementById('promptOk');
        this.promptCancelBtn = document.getElementById('promptCancel');

        this.toast = document.getElementById('toast');

        this.pendingAction = null;
        this.pendingPromptAction = null;

        this.searchTimeout = null;
        this.refreshInterval = null;

        this.searchTimeout = null;
        this.refreshInterval = null;

        // Settings
        this.settings = {
            theme: '#9146FF',
            muted: false,
            language: 'hu' // Default language
        };
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsSave = document.getElementById('settingsSave');
        this.settingsCancel = document.getElementById('settingsCancel');
        this.settingsSave = document.getElementById('settingsSave');
        this.settingsCancel = document.getElementById('settingsCancel');
        this.settingMuted = document.getElementById('settingMuted');
        this.settingLanguage = document.getElementById('settingLanguage');

        // Help Modal
        this.helpBtn = document.getElementById('helpBtn');
        this.helpModal = document.getElementById('helpModal');
        this.helpClose = document.getElementById('helpClose');

        this.colorSwatches = document.querySelectorAll('.color-swatch');

        this.init();
    }

    init() {
        this.loadSettings(); // Load first to apply theme
        this.bindEvents();
        this.loadFromURL();
        this.loadSavedGroups();
        this.startAutoRefresh();
    }

    showConfirm(message, action) {
        console.log('Opening confirm modal:', message);
        this.modalMessage.textContent = message;
        this.pendingAction = action;
        this.modal.classList.add('active'); // Use active class
    }

    hideConfirm() {
        this.modal.classList.remove('active');
        this.pendingAction = null;
    }

    showPrompt(title, callback) {
        this.promptTitle.textContent = title;
        this.promptInput.value = '';
        this.pendingPromptAction = callback;
        this.promptModal.classList.add('active');
        setTimeout(() => this.promptInput.focus(), 100);
    }

    hidePrompt() {
        this.promptModal.classList.remove('active');
        this.pendingPromptAction = null;
    }

    showNotification(msg) {
        this.toast.textContent = msg;
        this.toast.classList.add('visible');
        setTimeout(() => {
            this.toast.classList.remove('visible');
        }, 3000);
    }

    startAutoRefresh() {
        // Refresh every 60 seconds
        this.refreshInterval = setInterval(() => {
            this.streamers.forEach(name => {
                this.updateStreamerMetadata(name);
            });
        }, 60000);
    }

    bindEvents() {
        // Modal Events
        this.cancelBtn.addEventListener('click', () => this.hideConfirm());
        this.confirmBtn.addEventListener('click', () => {
            if (this.pendingAction) this.pendingAction();
            this.hideConfirm();
        });

        // Settings Events
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.settingsCancel.addEventListener('click', () => {
            this.settingsModal.classList.remove('active');
        });
        this.settingsSave.addEventListener('click', () => this.saveSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.settingsModal.classList.remove('active');
        });

        this.colorSwatches.forEach(btn => {
            btn.addEventListener('click', () => {
                this.colorSwatches.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Help Events
        this.helpBtn.addEventListener('click', () => {
            this.helpModal.classList.add('active');
        });
        this.helpClose.addEventListener('click', () => {
            this.helpModal.classList.remove('active');
        });
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.helpModal.classList.remove('active');
        });

        // Modal Events (Prompt)
        this.promptCancelBtn.addEventListener('click', () => this.hidePrompt());

        const handlePromptSubmit = () => {
            const val = this.promptInput.value.trim();
            if (val && this.pendingPromptAction) {
                this.pendingPromptAction(val);
                this.hidePrompt();
            }
        };

        this.promptOkBtn.addEventListener('click', handlePromptSubmit);
        this.promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePromptSubmit();
        });

        // Close modals on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideConfirm();
        });
        this.promptModal.addEventListener('click', (e) => {
            if (e.target === this.promptModal) this.hidePrompt();
        });

        // Edit Group Modal Events
        this.editGroupCancel.addEventListener('click', () => {
            this.editGroupModal.classList.remove('active');
        });

        this.editGroupSave.addEventListener('click', () => this.saveGroupChanges());

        this.editGroupAddBtn.addEventListener('click', () => this.addToGroupEditor());

        this.editGroupAddInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addToGroupEditor();
        });

        this.editGroupModal.addEventListener('click', (e) => {
            if (e.target === this.editGroupModal) this.editGroupModal.classList.remove('active');
        });

        this.mobileMenuBtn.addEventListener('click', () => {
            this.sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !this.mobileMenuBtn.contains(e.target) && this.sidebar.classList.contains('mobile-open')) {
                    this.sidebar.classList.remove('mobile-open');
                }
            }
            // Close search results if clicked outside
            if (!this.input.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.classList.add('hidden');
            }
        });

        this.addBtn.addEventListener('click', () => this.addStreamerFromInput());

        // Search Input Logic
        this.input.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const val = e.target.value.trim();
            if (val.length >= 2) {
                this.searchTimeout = setTimeout(() => this.performSearch(val), 300);
            } else {
                this.searchResults.classList.add('hidden');
            }
        });

        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchResults.classList.add('hidden');
                this.addStreamerFromInput();
            }
        });

        this.chatToggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeChatBtn.addEventListener('click', () => this.toggleChat());

        // Saved Groups
        this.saveGroupBtn.addEventListener('click', () => this.saveCurrentGroup());
    }

    async performSearch(query) {
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await res.json();
            this.renderSearchResults(results);
        } catch (e) {
            console.error('Search error', e);
        }
    }

    renderSearchResults(results) {
        this.searchResults.innerHTML = '';
        if (results.length === 0) {
            this.searchResults.classList.add('hidden');
            return;
        }

        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.onclick = () => {
                this.addStreamer(item.login); // Use standardized logic
                this.input.value = '';
                this.searchResults.classList.add('hidden');
            };

            div.innerHTML = `
                <img src="${item.thumbnail}" class="search-avatar" alt="${item.name}">
                <div class="search-info">
                    <span style="font-weight:600">${item.name}</span>
                    <span class="search-game">${item.game || ''}</span>
                </div>
                ${item.is_live ? '<span class="search-live">LIVE</span>' : ''}
            `;
            this.searchResults.appendChild(div);
        });
        this.searchResults.classList.remove('hidden');
    }

    saveCurrentGroup() {
        if (this.streamers.length === 0) return this.showNotification("Add streamers first!");

        this.showPrompt("Name this group:", (name) => {
            const groups = JSON.parse(localStorage.getItem('twitchGroups') || '[]');
            // Check if exists
            const idx = groups.findIndex(g => g.name === name);
            if (idx > -1) groups[idx].streamers = [...this.streamers];
            else groups.push({ name, streamers: [...this.streamers] });

            localStorage.setItem('twitchGroups', JSON.stringify(groups));
            this.loadSavedGroups();
            this.showNotification("Group saved successfully!");
        });
    }

    async loadSavedGroups() {
        const groups = JSON.parse(localStorage.getItem('twitchGroups') || '[]');
        this.savedGroupsList.innerHTML = '';

        if (groups.length === 0) {
            this.savedGroupsList.innerHTML = '<div style="font-size:0.8rem; padding:0.5rem; color:#666">No saved groups</div>';
            return;
        }

        // 1. Collect all unique streamers
        const allStreamers = new Set();
        groups.forEach(g => {
            g.streamers.forEach(s => allStreamers.add(s));
        });

        // 2. Render Groups Initial State
        const groupElements = [];
        groups.forEach((g, index) => {
            const div = document.createElement('div');
            div.className = 'saved-group-item';
            div.dataset.index = index; // Store index for updates

            // Create a span for the status info
            const statusHtml = `<span class="group-status-info" style="font-size:0.8em; margin-left:5px; color:#666;">...</span>`;

            div.innerHTML = `
                <span class="saved-group-name">
                    ${g.name} 
                    <span style="color:#666">(${g.streamers.length})</span>
                    ${statusHtml}
                </span>
                <div style="display:flex; gap:5px;">
                    <button class="remove-btn" style="font-size:1.1em" title="Edit group">✎</button>
                    <button class="remove-btn" style="color:var(--text-secondary)" title="Delete group">×</button>
                </div>
            `;

            // Text click loads group
            div.querySelector('.saved-group-name').onclick = () => this.restoreGroup(g.streamers);

            // Edit button
            const editBtn = div.querySelectorAll('.remove-btn')[0];
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.openGroupEditor(index);
            };

            // Remove button
            const deleteBtn = div.querySelectorAll('.remove-btn')[1];
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.showConfirm(`Delete group "${g.name}"?`, () => {
                    groups.splice(index, 1);
                    localStorage.setItem('twitchGroups', JSON.stringify(groups));
                    this.loadSavedGroups();
                });
            };

            this.savedGroupsList.appendChild(div);
            groupElements.push({ div, group: g });
        });

        // 3. Fetch Status in Background
        if (allStreamers.size > 0) {
            try {
                const uniqueList = Array.from(allStreamers).join(',');
                const res = await fetch(`/api/streams?users=${encodeURIComponent(uniqueList)}`);
                const statusMap = await res.json();

                // 4. Update UI
                groupElements.forEach(item => {
                    const onlineCount = item.group.streamers.filter(s => statusMap[s] && statusMap[s].online).length;
                    const statusSpan = item.div.querySelector('.group-status-info');
                    if (statusSpan) {
                        if (onlineCount > 0) {
                            statusSpan.innerHTML = `<span style="color:#10b981; font-weight:bold;">● ${onlineCount} online</span>`;
                        } else {
                            statusSpan.textContent = ''; // Hide if none online
                        }
                    }
                });

            } catch (e) {
                console.error('Error fetching group status:', e);
            }
        }
    }

    openGroupEditor(index) {
        const groups = JSON.parse(localStorage.getItem('twitchGroups') || '[]');
        const group = groups[index];
        if (!group) return;

        this.editingGroupIndex = index;
        this.editingStreamers = [...group.streamers];

        this.editGroupTitle.textContent = `Edit Group: ${group.name}`;
        this.editGroupAddInput.value = '';
        this.renderGroupEditorList();

        this.editGroupModal.classList.add('active');
        setTimeout(() => this.editGroupAddInput.focus(), 100);
    }

    renderGroupEditorList() {
        this.editGroupList.innerHTML = '';
        this.editingStreamers.forEach((s, idx) => {
            const div = document.createElement('div');
            div.className = 'edit-group-item';
            div.innerHTML = `
                <span>${s}</span>
                <span style="font-size:0.9em; cursor:pointer;" onclick="app.removeFromGroupEditor(${idx})">✕</span>
            `;
            this.editGroupList.appendChild(div);
        });
    }

    addToGroupEditor() {
        const val = this.editGroupAddInput.value.trim().toLowerCase();
        if (val && !this.editingStreamers.includes(val)) {
            this.editingStreamers.push(val);
            this.renderGroupEditorList();
            this.editGroupAddInput.value = '';
        }
    }

    removeFromGroupEditor(arrayIndex) {
        this.editingStreamers.splice(arrayIndex, 1);
        this.renderGroupEditorList();
    }

    saveGroupChanges() {
        const groups = JSON.parse(localStorage.getItem('twitchGroups') || '[]');
        if (this.editingGroupIndex !== null && groups[this.editingGroupIndex]) {
            groups[this.editingGroupIndex].streamers = this.editingStreamers;
            localStorage.setItem('twitchGroups', JSON.stringify(groups));
            this.loadSavedGroups();
            this.showNotification("Group updated!");
            this.editGroupModal.classList.remove('active');
        }
    }

    restoreGroup(streamerList) {
        // Clear current
        [...this.streamers].forEach(s => this.removeStreamer(s));
        // Add new ones
        streamerList.forEach(s => this.addStreamer(s));
    }


    addStreamerFromInput() {
        const inputVal = this.input.value.trim();
        if (!inputVal) return;

        let type = 'twitch';
        let id = inputVal;

        // Check for Kick URL
        // https://kick.com/username
        if (inputVal.includes('kick.com/')) {
            const parts = inputVal.split('kick.com/');
            if (parts[1]) {
                type = 'kick';
                id = parts[1].split('/')[0].split('?')[0]; // simple clean
            }
        }
        // Check for YouTube URL
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        else if (inputVal.includes('youtube.com/') || inputVal.includes('youtu.be/')) {
            type = 'youtube';
            // Simple regex for ID
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = inputVal.match(regExp);
            if (match && match[2].length === 11) {
                id = match[2];
            } else {
                this.showNotification("Invalid YouTube URL");
                return;
            }
        }

        // Clean ID for Twitch (if just username input or url)
        else if (inputVal.includes('twitch.tv/')) {
            const parts = inputVal.split('twitch.tv/');
            if (parts[1]) {
                id = parts[1].split('/')[0].split('?')[0];
            }
        }

        const finalId = type === 'twitch' ? id.toLowerCase() : (type === 'kick' ? `k:${id.toLowerCase()}` : `y:${id}`);

        if (!this.streamers.includes(finalId)) {
            this.addStreamer(finalId);
            this.input.value = '';
            this.searchResults.classList.add('hidden');
        }
    }

    async addStreamer(identifier, isActive = true) {
        if (this.streamers.includes(identifier)) return;

        this.streamers.push(identifier);
        this.updateURL();

        // Render shell first
        this.renderSidebarItem(identifier);

        if (isActive) {
            this.activateStream(identifier);
        }

        this.emptyState.style.display = 'none';

        // Fetch data (only for Twitch currently fully supported for metadata)
        this.updateStreamerMetadata(identifier);
    }

    activateStream(name) {
        // Check if already active
        if (document.getElementById(`embed-${name}`)) return;

        this.renderStreamEmbed(name);
        this.updateGrid();
        this.renderChatTabs();

        // Auto selection for chat if it's the only active one or first one
        const activeCount = document.querySelectorAll('.stream-container').length;
        if (activeCount === 1) {
            this.loadChat(name);
        }
    }

    handleStreamerClick(name) {
        const embed = document.getElementById(`embed-${name}`);
        if (embed) {
            // Already active, just toggle focus
            this.toggleFocus(name);
        } else {
            // activate it
            this.activateStream(name);
            // Optionally focus it?
            // this.toggleFocus(name);
        }
    }

    // Settings Methods
    loadSettings() {
        const saved = localStorage.getItem('twitchSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        // Ensure valid language
        if (!['en', 'hu'].includes(this.settings.language)) this.settings.language = 'hu';

        this.applySettings();
        this.applyLanguage();
    }

    applySettings() {
        // Apply Theme
        document.documentElement.style.setProperty('--accent', this.settings.theme);
        // Darken for hover (simple approximation)
        // For accurate hover, we might need more logic, but let's just keep same or use opacity
        document.documentElement.style.setProperty('--accent-hover', this.settings.theme);
    }

    openSettings() {
        // Set UI to current state
        this.settingMuted.checked = this.settings.muted;
        this.settingLanguage.value = this.settings.language;
        this.colorSwatches.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.theme);
        });
        this.settingsModal.classList.add('active');
    }

    saveSettings() {
        this.settings.muted = this.settingMuted.checked;
        this.settings.language = this.settingLanguage.value;
        const activeSwatch = document.querySelector('.color-swatch.active');
        if (activeSwatch) {
            this.settings.theme = activeSwatch.dataset.color;
        }

        localStorage.setItem('twitchSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.applyLanguage();
        // Reload to apply deeply nested changes if needed, but for now replacement should work
        this.showNotification(this.t('toastSettingsSaved'));
        this.settingsModal.classList.remove('active');
    }

    t(key) {
        return TRANSLATIONS[this.settings.language][key] || key;
    }

    applyLanguage() {
        const lang = this.settings.language;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[lang][key]) {
                // Handle lists specially if needed, or just HTML
                if (key.includes('List')) {
                    el.innerHTML = TRANSLATIONS[lang][key];
                } else {
                    el.textContent = TRANSLATIONS[lang][key];
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (TRANSLATIONS[lang][key]) {
                el.placeholder = TRANSLATIONS[lang][key];
            }
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (TRANSLATIONS[lang][key]) {
                el.title = TRANSLATIONS[lang][key];
            }
        });

        // Update dynamic content via re-render if needed? 
        // For now, static labels are the main concern.
    }

    async updateStreamerMetadata(identifier) {
        // Kick Handling
        if (identifier.startsWith('k:')) {
            const item = document.querySelector(`.stream-item[data-name="${identifier}"]`);
            if (item) {
                const infoSpan = item.querySelector('.stream-info');
                const displayName = identifier.substring(2);

                // Since we don't have real API data, assume online and set nice text
                const statusIndicator = item.querySelector('.status-indicator');
                statusIndicator.classList.add('online');

                infoSpan.textContent = "Kick Stream";
                item.setAttribute('title', `${displayName} on Kick`);

                // Try to load avatar if we can guess it? No reliable way without API.
                // We could try: https://kick.com/api/v1/users/{slug} but CORS will block.
            }
            // Refresh tabs to show name if needed (kick names are usually static based on ID)
            this.renderChatTabs();
            return;
        }

        const item = document.querySelector(`.stream-item[data-name="${identifier}"]`);
        if (!item) return;

        try {
            const res = await fetch(`/api/stream/${identifier}`);
            const data = await res.json();

            const statusIndicator = item.querySelector('.status-indicator');
            const infoSpan = item.querySelector('.stream-info');
            const avatarImg = item.querySelector('.sidebar-avatar');

            if (data.avatar) {
                avatarImg.src = data.avatar;
            } else if (identifier.startsWith('y:') && data.thumbnail) {
                // For YouTube, use thumbnail as avatar if no avatar provided (oembed doesn't give avatar, but gives thumbnail)
                // Or separate logic: avatarImg.src = data.thumbnail;
                // Actually data.thumbnail is video thumbnail. Let's use it for now as it's better than gray circle.
                // But sidebar-avatar is small and round.
                // YouTube oEmbed doesn't give channel avatar.
            }

            if (data.online) {
                statusIndicator.classList.add('online');
                // For YouTube: viewers is 0, so maybe don't show "0 • ChannelName"
                if (identifier.startsWith('y:')) {
                    // For YouTube:
                    // data.game -> Channel Name
                    // data.title -> Page Title (visible on hover) or we can swap
                    // Let's make stream-info show Channel Name
                    // And stream-name (displayName) show Video Title?
                    // renderSidebarItem created: .stream-name = {Icon}{DisplayName}
                    // .stream-info = Loading...

                    // We want: 
                    // Name: Video Title
                    // Info: Channel Name

                    const nameSpan = item.querySelector('.stream-name');
                    if (nameSpan) {
                        // Keep icon
                        const icon = '<span style="color:#ff0000; font-weight:bold; font-size:0.8em; margin-right:4px;">▶</span>';
                        nameSpan.innerHTML = `${icon}${data.title}`;
                    }

                    infoSpan.textContent = data.game; // Channel Name
                    item.setAttribute('title', data.title);
                } else {
                    infoSpan.textContent = `${data.viewers.toLocaleString()} • ${data.game}`;
                    item.setAttribute('title', data.title);
                }
            } else {
                statusIndicator.classList.remove('online');
                infoSpan.textContent = 'Offline';
            }

            this.renderChatTabs();
        } catch (e) {
            console.error('Error fetching meta:', e);
        }
    }

    confirmRemoveStreamer(name) {
        this.showConfirm(`Remove ${name}?`, () => {
            this.removeStreamer(name);
        });
    }

    removeStreamer(name) {
        // Cleanup player instance if exists (Twitch)
        if (this.players[name]) {
            // Can't really destroy, but removing reference helps.
            // If the library had a destroy method we'd call it.
            // For now, let's just ensure we don't hold onto it.
            delete this.players[name];
        }

        this.streamers = this.streamers.filter(s => s !== name);
        this.updateURL();

        // Remove Sidebar Item
        const item = document.querySelector(`.stream-item[data-name="${name}"]`);
        if (item) item.remove();

        // Remove Embed
        const embed = document.getElementById(`embed-${name}`);
        if (embed) embed.remove();

        this.updateGrid();
        this.renderChatTabs();

        if (this.streamers.length === 0) {
            this.emptyState.style.display = 'block';
            this.chatContainer.innerHTML = '';
        } else if (this.activeChat === name) {
            // Switch chat to next available
            this.loadChat(this.streamers[0]);
        }
    }

    renderSidebarItem(identifier) {
        // Parse for display
        let displayName = identifier;
        let logo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzMzMiLz48L3N2Zz4=";
        let platformIcon = '';

        if (identifier.startsWith('k:')) {
            displayName = identifier.substring(2);
            // Kick green icon or proper logo if we had one. 
            // Using a simple SVG K or Kick logo placeholder
            logo = "https://kick.com/favicon.ico"; // Try using favicon as avatar fallback? Or specific asset.
            // Actually, let's use a nice SVG for the platform icon in the name, and the default avatar.
            platformIcon = '<span style="color:#53fc18; font-weight:bold; font-size:0.8em; margin-right:4px;">K</span>';
        } else if (identifier.startsWith('y:')) {
            displayName = 'YouTube Loading...';
            platformIcon = '<span style="color:#ff0000; font-weight:bold; font-size:0.8em; margin-right:4px;">▶</span>';
        }

        const div = document.createElement('div');
        div.className = 'stream-item';
        div.dataset.name = identifier;
        div.onclick = () => this.handleStreamerClick(identifier);

        div.innerHTML = `
            <img src="${logo}" class="sidebar-avatar" alt="${displayName}" onerror="this.src='${logo}'">
            <div class="stream-item-content">
                <div class="stream-item-header">
                    <span class="status-indicator online"></span>
                    <span class="stream-name">${platformIcon}${displayName}</span>
                </div>
                <span class="stream-info">Loading...</span>
            </div>
            <button class="remove-btn" onclick="event.stopPropagation(); app.confirmRemoveStreamer('${identifier}')">✕</button>
        `;
        this.listContainer.appendChild(div);
    }

    renderStreamEmbed(identifier) {
        // Parse identifier
        let type = 'twitch';
        let id = identifier;

        if (identifier.startsWith('k:')) {
            type = 'kick';
            id = identifier.substring(2);
        } else if (identifier.startsWith('y:')) {
            type = 'youtube';
            id = identifier.substring(2);
        }

        const container = document.createElement('div');
        container.className = 'stream-container';
        container.id = `embed-${identifier}`; // Use full identifier for unique ID

        // Add overlay controls
        const overlay = document.createElement('div');
        overlay.className = 'stream-overlay';
        overlay.innerHTML = `
            <button class="overlay-btn" onclick="app.toggleFocus('${identifier}')">Focus</button>
            <button class="overlay-btn" onclick="app.confirmRemoveStreamer('${identifier}')">Close</button>
        `;
        container.appendChild(overlay);

        this.gridContainer.appendChild(container);
        this.updateGrid(); // Update grid layout BEFORE creating player

        // Platform specific embed
        if (type === 'twitch') {
            const options = {
                width: '100%',
                height: '100%',
                channel: id,
                layout: 'video',
                parent: CONFIG.getParent(),
                theme: 'dark',
                muted: this.settings.muted
            };
            // Wrapper for Twitch Embed 
            const embedDiv = document.createElement('div');
            embedDiv.style.width = '100%';
            embedDiv.style.height = '100%';
            embedDiv.id = `twitch-embed-${id}`;
            container.appendChild(embedDiv);

            const player = new Twitch.Embed(`twitch-embed-${id}`, options);
            this.players[identifier] = player;
        } else if (type === 'kick') {
            const iframe = document.createElement('iframe');
            iframe.src = `https://player.kick.com/${id}?muted=${this.settings.muted}&autoplay=true`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.allow = "autoplay; fullscreen; picture-in-picture";
            container.appendChild(iframe);
        } else if (type === 'youtube') {
            const iframe = document.createElement('iframe');
            // autoplay=1&mute=1 required for autoplay in many browsers
            const mutedParam = this.settings.muted ? '1' : '0';
            iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=${mutedParam}`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.allowFullscreen = true;
            container.appendChild(iframe);
        }
    }

    toggleFocus(name) {
        const container = document.getElementById(`embed-${name}`);
        const isFocused = container.classList.contains('focused');

        // Reset all
        document.querySelectorAll('.stream-container').forEach(el => {
            el.classList.remove('focused');
            // Reset button text
            const btn = el.querySelector('.overlay-btn');
            if (btn) btn.textContent = 'Focus';
        });
        this.gridContainer.classList.remove('focus-mode');

        if (!isFocused) {
            // Enable focus
            container.classList.add('focused');
            this.gridContainer.classList.add('focus-mode');
            // Update button text
            const btn = container.querySelector('.overlay-btn');
            if (btn) btn.textContent = 'Unfocus';
        }
    }

    updateGrid() {
        const count = document.querySelectorAll('.stream-container').length;
        this.gridContainer.dataset.count = count.toString();
        // If more than 4, we might need custom CSS or fallback grid logic
        // For now, the CSS handles 1-4 nicely. Flex wrapping handles > 4 somewhat.
    }

    renderChatTabs() {
        this.chatTabs.innerHTML = '';
        this.streamers.forEach(s => {
            // Only show tab if active (embed exists)
            if (!document.getElementById(`embed-${s}`)) return;

            const btn = document.createElement('button');
            btn.className = 'chat-tab';
            if (s === this.activeChat) btn.classList.add('active');

            // Try to find display name
            let displayName = s;
            if (s.startsWith('y:')) {
                // For YouTube, try to get Channel Name from sidebar
                const sidebarItem = document.querySelector(`.stream-item[data-name="${s}"]`);
                if (sidebarItem) {
                    const infoSpan = sidebarItem.querySelector('.stream-info');
                    // infoSpan usually holds "Channel Name" or "Viewers • Game"
                    // In our YouTube logic, we set infoSpan to Channel Name (data.game)
                    if (infoSpan && infoSpan.textContent && infoSpan.textContent !== 'Loading...' && infoSpan.textContent !== 'Offline') {
                        displayName = infoSpan.textContent;
                    }
                }
            } else if (s.startsWith('k:')) {
                // Kick ID is usually the username
                displayName = s.substring(2);
            }

            btn.textContent = displayName;
            btn.onclick = () => this.loadChat(s);
            this.chatTabs.appendChild(btn);
        });
    }

    async loadChat(identifier) {
        if (this.activeChat === identifier) return;
        this.activeChat = identifier;

        // Update Tabs
        this.renderChatTabs();

        this.chatContainer.innerHTML = '';

        if (identifier.startsWith('k:')) {
            const kickUser = identifier.substring(2);
            const iframe = document.createElement('iframe');
            // Try standard chat URL. 
            // Note: If Kick blocks this via X-Frame-Options, we might need a "Popout" button instead.
            iframe.src = `https://kick.com/${kickUser}/chat`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            this.chatContainer.appendChild(iframe);
        } else if (identifier.startsWith('y:')) {
            const videoId = identifier.substring(2);

            // Check metadata for live status if available
            const container = document.createElement('div');
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.background = '#18181b';
            container.style.color = '#efeff1';

            let isLive = true;

            try {
                // Determine status from sidebar item or fetch
                const item = document.querySelector(`.stream-item[data-name="${identifier}"]`);
                if (item) {
                    const res = await fetch(`/api/stream/${identifier}`);
                    const data = await res.json();

                    if (data.is_vod === true) isLive = false;
                    else if (data.online === false && data.title !== 'No Data') isLive = false;
                }
            } catch (e) { console.log('Chat status check failed', e); }

            if (isLive) {
                const domain = window.location.hostname;
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${domain}`;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                this.chatContainer.appendChild(iframe);
            } else {
                container.innerHTML = `
                    <div style="text-align:center; padding: 20px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:10px; color:#adadb8;">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <h3 style="margin-bottom:10px;">Kommentek</h3>
                        <p style="color:#adadb8; font-size:0.9rem; margin-bottom:20px;">Ez nem élő videó. A chat itt nem érhető el.</p>
                        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" 
                           style="background: #ff0000; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: 600;">
                           Kommentek Megnyitása
                        </a>
                    </div>
                 `;
                this.chatContainer.appendChild(container);
            }

        } else {
            // Twitch
            const iframe = document.createElement('iframe');
            const parents = CONFIG.getParent();
            const parentParams = parents.map(p => `parent=${p}`).join('&');
            iframe.src = `https://www.twitch.tv/embed/${identifier}/chat?${parentParams}&darkpopout=true`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            this.chatContainer.appendChild(iframe);
        }

        if (window.innerWidth > 768) {
            if (this.chatSidebar.classList.contains('hidden')) {
                this.toggleChat();
            }
        }
    }

    toggleChat() {
        const isHidden = this.chatSidebar.classList.contains('hidden');
        if (isHidden) {
            this.chatSidebar.classList.remove('hidden');
            this.chatSidebar.style.display = 'flex';
            this.chatToggleBtn.classList.add('active');
        } else {
            this.chatSidebar.classList.add('hidden');
            setTimeout(() => {
                this.chatSidebar.style.display = 'none';
            }, 300); // match css transition
            this.chatToggleBtn.classList.remove('active');
        }
    }

    updateURL() {
        // Use path based URL: /streamer1/streamer2
        let newPath = '/';
        if (this.streamers.length > 0) {
            newPath = '/' + this.streamers.join('/');
        }
        // Keep existing query params if any (like auth codes, although those are distinct)
        const params = new URLSearchParams(window.location.search);
        // Clean up legacy param
        params.delete('streamers');

        const search = params.toString();
        const newUrl = newPath + (search ? '?' + search : '');

        window.history.replaceState({}, '', newUrl);
    }

    loadFromURL() {
        // 1. Check path segments first
        const pathSegments = window.location.pathname.split('/').filter(s => s.length > 0 && s !== 'auth');

        if (pathSegments.length > 0) {
            pathSegments.forEach((n, i) => this.addStreamer(n.trim(), i < 2)); // Limit initial 2
            return; // Priority to path
        }

        // 2. Fallback to query param
        const params = new URLSearchParams(window.location.search);
        const streamersParam = params.get('streamers');
        if (streamersParam) {
            const names = streamersParam.split(',');
            names.forEach((n, i) => this.addStreamer(n.trim(), i < 2)); // Limit initial 2
        }
    }
}

// Global instance
const app = new MultiTwitchApp();
