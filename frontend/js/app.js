// Load Theme immediately on start to prevent flickering
(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
})();

// Global application state
const state = {
    user: null,
    courses: [],
    enrolledCourses: [],
    totalCredits: 0,
    waitlist: [],
    filters: {
        search: '',
        department: '',
        semester: '',
        availableOnly: false
    }
};

// -------------------------------------------------------------
// DOM ELEMENTS REFERENCE
// -------------------------------------------------------------
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');

// Forms
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Toggle Links
const toRegisterBtn = document.getElementById('to-register-btn');
const toLoginBtn = document.getElementById('to-login-btn');

// User profile elements
const userDisplayName = document.getElementById('user-display-name');
const userDisplayDept = document.getElementById('user-display-dept');
const avatarLetters = document.getElementById('avatar-letters');

// Stats elements
const statCredits = document.getElementById('stat-credits');
const statClassCount = document.getElementById('stat-gpa'); // Displays GPA
const statCompletedCredits = document.getElementById('stat-completed-credits');
const statDepartment = document.getElementById('stat-department');
const creditsProgressBar = document.getElementById('credits-progress-bar');

// Filters
const courseSearchInput = document.getElementById('course-search-input');
const deptFilterTabs = document.getElementById('dept-filter-tabs');
const availableOnlyCheckbox = document.getElementById('available-only-checkbox');

// Grid elements
const courseGrid = document.getElementById('course-grid');
const enrolledList = document.getElementById('enrolled-list');

// Action Buttons
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    setupEventListeners();
    setupProfileListeners();
    setupChatbot();
});

// -------------------------------------------------------------
// TOAST NOTIFICATIONS UTILITY
// -------------------------------------------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    
    // Create element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-solid fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    container.appendChild(toast);
    
    // Setup close button click
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto-remove toast after 4.5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4500);
}

function removeToast(toast) {
    if (toast.parentNode) {
        toast.classList.add('toast-out');
        // Wait for CSS animation to finish
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }
}

// -------------------------------------------------------------
// EVENT LISTENERS MANAGEMENT
// -------------------------------------------------------------
function setupEventListeners() {
    // Auth navigation toggles
    toRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.classList.remove('active');
        setTimeout(() => {
            registerCard.classList.add('active');
        }, 150);
    });
    
    toLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.classList.remove('active');
        setTimeout(() => {
            loginCard.classList.add('active');
        }, 150);
    });

    // Form Submissions
    loginForm.addEventListener('submit', handleLoginSubmit);
    registerForm.addEventListener('submit', handleRegisterSubmit);
    
    // Filters and Search listeners (with basic input debounce)
    let searchDebounceTimeout;
    courseSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            state.filters.search = e.target.value.trim();
            fetchCourses();
        }, 300);
    });

    availableOnlyCheckbox.addEventListener('change', (e) => {
        state.filters.availableOnly = e.target.checked;
        fetchCourses();
    });

    // Department Filter Tab clicks
    deptFilterTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        
        // Update active class
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        state.filters.department = tab.dataset.dept;
        fetchCourses();
    });

    // Semester Filter dropdown listener
    const courseSemesterFilter = document.getElementById('course-semester-filter');
    if (courseSemesterFilter) {
        courseSemesterFilter.addEventListener('change', (e) => {
            state.filters.semester = e.target.value;
            fetchCourses();
        });
    }

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Theme Switch Toggle click
    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            showToast('Dark mode activated', 'success');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            showToast('Light mode activated', 'success');
        }
    });

    // Nav Tab view switching
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === target) {
                    panel.classList.add('active');
                }
            });

            if (target === 'degree-plan-tab') {
                fetchAndRenderDegreePlan();
            }
        });
    });

    const degreeDeptSelect = document.getElementById('degree-dept-select');
    if (degreeDeptSelect) {
        degreeDeptSelect.addEventListener('change', (e) => {
            fetchAndRenderDegreePlan(e.target.value);
        });
    }
}

// -------------------------------------------------------------
// STATE TRANSITIONS & SCREEN ROUTING
// -------------------------------------------------------------
function switchView(viewId) {
    if (viewId === 'dashboard') {
        authView.classList.remove('active');
        setTimeout(() => {
            dashboardView.classList.add('active');
        }, 200);
    } else {
        dashboardView.classList.remove('active');
        setTimeout(() => {
            authView.classList.add('active');
        }, 200);
    }
}

// -------------------------------------------------------------
// API COMMUNICATIONS & SESSIONS
// -------------------------------------------------------------

// Check if user is logged in on reload
async function checkAuthSession() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.logged_in) {
            setupUserSession(data.student);
        } else {
            switchView('auth');
        }
    } catch (err) {
        showToast('Cannot connect to database. Ensure Flask server is running.', 'error');
        switchView('auth');
    }
}

// User setup once validated
function setupUserSession(student) {
    state.user = student;
    
    // Set Profile Names
    userDisplayName.textContent = student.name;
    userDisplayDept.textContent = student.department;
    statDepartment.textContent = student.department;
    
    // Get initials for profile avatar fallback
    const nameParts = student.name.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);
    avatarLetters.textContent = initials;

    switchView('dashboard');
    
    // Fetch dashboard and other components content
    fetchCourses();
    fetchEnrollments();
    fetchAcademicHistory();
    fetchRecommendations();
    fetchWaitlistStatus();
    loadProfileData(student);
    fetchAndRenderDegreePlan();
    
    showToast(`Welcome back, ${student.name}!`, 'success');
}

// Form logins
async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            loginForm.reset();
            setupUserSession(data.student);
        } else {
            showToast(data.error || 'Login failed.', 'error');
        }
    } catch (err) {
        showToast('Server connection error. Please try again.', 'error');
    }
}

// Form registrations
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const department = document.getElementById('reg-dept').value;
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, department, password })
        });
        const data = await res.json();

        if (res.ok) {
            registerForm.reset();
            setupUserSession(data.student);
        } else {
            showToast(data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        showToast('Server connection error. Please try again.', 'error');
    }
}

// Logout session clear
async function handleLogout() {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            state.user = null;
            state.courses = [];
            state.enrolledCourses = [];
            state.totalCredits = 0;
            switchView('auth');
            showToast('You have successfully logged out.', 'success');
        }
    } catch (err) {
        showToast('Error during logout.', 'error');
    }
}

// -------------------------------------------------------------
// COURSE CATALOG & FILTER DATA RETRIEVAL
// -------------------------------------------------------------
async function fetchCourses() {
    const { search, department, semester, availableOnly } = state.filters;
    const url = new URL('/api/courses', window.location.origin);
    
    if (search) url.searchParams.append('search', search);
    if (department) url.searchParams.append('department', department);
    if (semester) url.searchParams.append('semester', semester);
    if (availableOnly) url.searchParams.append('available', 'true');

    try {
        const res = await fetch(url);
        if (res.ok) {
            state.courses = await res.json();
            renderCourseGrid();
        } else {
            showToast('Failed to load courses.', 'error');
        }
    } catch (err) {
        showToast('Failed to fetch courses from server.', 'error');
    }
}

// -------------------------------------------------------------
// ENROLLMENT & DROPS MANAGEMENT
// -------------------------------------------------------------
async function fetchEnrollments() {
    try {
        const res = await fetch('/api/enrollments/my-courses');
        if (res.ok) {
            const data = await res.json();
            state.enrolledCourses = data.courses;
            state.totalCredits = data.total_credits;
            
            updateStatsUI();
            renderEnrolledSidebar();
            // Re-render catalog grid because buttons (Register vs Dropped status) and remaining capacities change
            renderCourseGrid();
        }
    } catch (err) {
        showToast('Failed to retrieve enrolled courses.', 'error');
    }
}

async function registerCourse(courseId, courseTitle) {
    // Frontend validation: Check if course matches student's current semester
    let course = state.courses ? state.courses.find(c => c.course_id === courseId) : null;
    if (!course && state.recommendations) {
        course = state.recommendations.find(c => c.course_id === courseId);
    }
    const currentSemester = state.user ? state.user.current_semester : null;
    
    if (course && currentSemester && parseInt(course.semester) !== parseInt(currentSemester)) {
        showToast(`Registration denied. You can only register for courses in your current semester (Semester ${currentSemester}).`, 'error');
        return;
    }

    try {
        const res = await fetch('/api/enrollments/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();

        if (res.ok) {
            showToast(data.message, 'success');
            fetchEnrollments();
            fetchCourses(); // refresh capacities
            fetchRecommendations(); // Refresh suggestions
            fetchAndRenderDegreePlan();
        } else {
            showToast(data.error || 'Could not complete registration.', 'error');
        }
    } catch (err) {
        showToast('Server connection error.', 'error');
    }
}

async function dropCourse(courseId, courseTitle) {
    if (!confirm(`Are you sure you want to drop the course "${courseTitle}"?`)) return;

    try {
        const res = await fetch('/api/enrollments/drop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();

        if (res.ok) {
            showToast(data.message, 'success');
            fetchEnrollments();
            fetchCourses(); // refresh capacities
            fetchRecommendations(); // Refresh suggestions
            fetchAndRenderDegreePlan();
        } else {
            showToast(data.error || 'Could not drop course.', 'error');
        }
    } catch (err) {
        showToast('Server connection error.', 'error');
    }
}

// -------------------------------------------------------------
// COURSE RECOMMENDATIONS ENGINE
// -------------------------------------------------------------
async function fetchRecommendations() {
    const recommenderGrid = document.getElementById('recommender-grid');
    const recommenderSection = document.getElementById('recommender-section');
    
    recommenderGrid.innerHTML = `
        <div class="loading-spinner-wrapper" style="grid-column: 1/-1; text-align: center; padding: 20px;">
            <div class="spinner" style="margin: 0 auto 10px;"></div>
            <p>Gathering academic suggestions...</p>
        </div>
    `;

    try {
        const res = await fetch('/api/recommender/suggest');
        if (!res.ok) {
            recommenderSection.classList.add('hidden');
            return;
        }
        const data = await res.json();
        
        if (data.length === 0) {
            recommenderSection.classList.add('hidden');
            return;
        }

        recommenderSection.classList.remove('hidden');
        recommenderGrid.innerHTML = '';
        
        data.forEach(course => {
            const isEnrolled = state.enrolledCourses.some(ec => ec.course_id === course.course_id);
            
            let btnHTML = '';
            if (isEnrolled) {
                btnHTML = `
                    <button class="btn btn-danger btn-block btn-sm" style="padding: 6px 12px; font-size: 0.8rem;" onclick="dropCourse(${course.course_id}, '${course.title}')">
                        <i class="fa-solid fa-circle-minus"></i> Drop
                    </button>
                `;
            } else if (course.enrolled_count >= course.capacity) {
                btnHTML = `
                    <button class="btn btn-secondary btn-block btn-sm" style="padding: 6px 12px; font-size: 0.8rem;" disabled>Full</button>
                `;
            } else {
                btnHTML = `
                    <button class="btn btn-primary btn-block btn-sm" style="padding: 6px 12px; font-size: 0.8rem;" onclick="registerCourse(${course.course_id}, '${course.title}')">
                        <i class="fa-solid fa-circle-plus"></i> Register
                    </button>
                `;
            }

            const card = document.createElement('div');
            card.className = 'recommender-card';
            card.innerHTML = `
                <div>
                    <span class="recommender-reason">${course.reason}</span>
                    <div class="recommender-title-row">
                        <h4>${course.title}</h4>
                        <span class="recommender-credits">${course.credits} Cr</span>
                    </div>
                    <div class="recommender-instructor">${course.course_code} &bull; ${course.instructor}</div>
                </div>
                <div class="recommender-footer">
                    ${btnHTML}
                </div>
            `;
            recommenderGrid.appendChild(card);
        });
    } catch (err) {
        console.error('Recommendations error:', err);
        recommenderSection.classList.add('hidden');
    }
}

// -------------------------------------------------------------
// STUDENT PROFILE MANAGEMENT
// -------------------------------------------------------------
function loadProfileData(student) {
    document.getElementById('profile-student-name').textContent = student.name;
    document.getElementById('profile-student-email').textContent = student.email;
    document.getElementById('profile-student-dept').textContent = student.department;
    document.getElementById('profile-bio').value = student.bio || '';
    
    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) nameInput.value = student.name || '';
    
    const emailInput = document.getElementById('profile-email-input');
    if (emailInput) emailInput.value = student.email || '';
    
    const semSelect = document.getElementById('profile-semester');
    if (semSelect) {
        semSelect.value = student.current_semester || 1;
    }
    const semBadge = document.getElementById('profile-student-semester');
    if (semBadge) {
        semBadge.textContent = `Semester ${student.current_semester || 1}`;
    }
    
    // Initialise avatar images
    updateAvatarUI(student.avatar, student.name);
}

function updateAvatarUI(avatarBase64, name) {
    const navAvatarLetters = document.getElementById('avatar-letters');
    const navAvatarImg = document.getElementById('user-avatar-img');
    const profileAvatarLetters = document.getElementById('profile-avatar-placeholder');
    const profileAvatarImg = document.getElementById('profile-avatar-img');

    // Get initials for profile avatar letters fallback
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);

    if (avatarBase64) {
        navAvatarImg.src = avatarBase64;
        navAvatarImg.classList.remove('hidden');
        navAvatarLetters.classList.add('hidden');

        profileAvatarImg.src = avatarBase64;
        profileAvatarImg.classList.remove('hidden');
        profileAvatarLetters.classList.add('hidden');
    } else {
        navAvatarImg.classList.add('hidden');
        navAvatarLetters.textContent = initials;
        navAvatarLetters.classList.remove('hidden');

        profileAvatarImg.classList.add('hidden');
        profileAvatarLetters.textContent = initials;
        profileAvatarLetters.classList.remove('hidden');
    }
}

async function fetchAcademicHistory() {
    try {
        const res = await fetch('/api/student/history');
        if (!res.ok) return;
        const data = await res.json();
        
        // Update stats cards
        document.getElementById('stat-gpa').textContent = Number(data.cumulative_gpa).toFixed(2);
        document.getElementById('stat-completed-credits').textContent = data.total_completed_credits;
        
        // Update profile large badges
        document.getElementById('history-gpa-val').textContent = Number(data.cumulative_gpa).toFixed(2);
        document.getElementById('history-credits-completed').textContent = data.total_completed_credits;
        
        // Populate transcript table
        const tbody = document.getElementById('completed-courses-tbody');
        tbody.innerHTML = '';
        
        if (data.completed.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
                        No completed courses found in your academic record.
                    </td>
                </tr>
            `;
            return;
        }

        data.completed.forEach(row => {
            const tr = document.createElement('tr');
            
            // Format grade badge
            let gradeClass = 'badge-grade-a';
            if (row.grade.startsWith('B')) gradeClass = 'badge-grade-b';
            else if (row.grade.startsWith('C')) gradeClass = 'badge-grade-c';
            else if (row.grade.startsWith('F')) gradeClass = 'badge-grade-f';

            tr.innerHTML = `
                <td><strong>${row.semester}</strong></td>
                <td>${row.course_code}</td>
                <td>${row.title}</td>
                <td style="text-align:center;">${row.credits}</td>
                <td style="text-align:center;">
                    <span class="badge-grade ${gradeClass}">${row.grade}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('History fetch error:', err);
    }
}

function setupProfileListeners() {
    const profileEditForm = document.getElementById('profile-edit-form');
    const profilePhotoWrapper = document.getElementById('profile-photo-wrapper');
    const profilePhotoInput = document.getElementById('profile-photo-input');

    // Click wrapper to trigger input file select
    profilePhotoWrapper.addEventListener('click', () => {
        profilePhotoInput.click();
    });

    profilePhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            showToast('Image size must be less than 1MB', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64String = reader.result;
            // Update preview
            updateAvatarUI(base64String, state.user.name);
            // Save immediately
            await updateProfile({
                name: state.user.name,
                email: state.user.email,
                bio: state.user.bio || '',
                avatar: base64String,
                current_semester: state.user.current_semester || 1
            });
        };
        reader.readAsDataURL(file);
    });

    profileEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name-input').value.trim();
        const email = document.getElementById('profile-email-input').value.trim();
        const bio = document.getElementById('profile-bio').value.trim();
        const current_semester = document.getElementById('profile-semester').value;
        await updateProfile({ name, email, bio, avatar: state.user.avatar, current_semester });
    });
}

async function updateProfile({ name, email, bio, avatar, current_semester }) {
    try {
        const res = await fetch('/api/student/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, bio, avatar, current_semester })
        });
        const data = await res.json();

        if (res.ok) {
            state.user.name = data.student.name;
            state.user.email = data.student.email;
            state.user.bio = data.student.bio;
            state.user.avatar = data.student.avatar;
            state.user.current_semester = data.student.current_semester;
            
            // Update nav displayName
            if (userDisplayName) {
                userDisplayName.textContent = state.user.name;
            }
            
            showToast('Profile saved successfully!', 'success');
            loadProfileData(state.user);
            // Re-fetch degree planner so it reflects any changes
            await fetchAndRenderDegreePlan();
        } else {
            showToast(data.error || 'Failed to save profile.', 'error');
        }
    } catch (err) {
        showToast('Error uploading profile details.', 'error');
    }
}

// -------------------------------------------------------------
// CHATBOT INTERACTION CONTROLLER
// -------------------------------------------------------------
function setupChatbot() {
    const chatInputForm = document.getElementById('chatbot-input-form');
    const chatUserInput = document.getElementById('chat-user-input');
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatChips = document.querySelectorAll('.chat-chip');

    chatInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = chatUserInput.value.trim();
        if (!query) return;

        chatUserInput.value = '';
        await handleChatQuery(query);
    });

    chatChips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const query = chip.dataset.query;
            await handleChatQuery(query);
        });
    });

    async function handleChatQuery(query) {
        appendMessage(query, 'user');
        const typingIndicator = appendTypingIndicator();
        
        try {
            const res = await fetch('/api/chatbot/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query })
            });
            const data = await res.json();
            
            typingIndicator.remove();
            
            if (res.ok) {
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage('Sorry, I encountered an issue processing that query.', 'bot');
            }
        } catch (err) {
            typingIndicator.remove();
            appendMessage('Connection error. I could not reach the chatbot.', 'bot');
        }
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'} animate-message`;
        
        const avatarHTML = sender === 'user' 
            ? `<div class="msg-avatar"><i class="fa-solid fa-user"></i></div>`
            : `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>`;
            
        // Convert linebreaks, list items, bold tags
        let formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\* ([^*<]+)/g, '<li>$1</li>');
            
        if (formattedText.includes('<li>')) {
            // Find consecutive list items and wrap them
            formattedText = formattedText.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        }

        msgDiv.innerHTML = `
            ${avatarHTML}
            <div class="msg-content">
                ${formattedText}
            </div>
        `;
        
        chatMessagesContainer.appendChild(msgDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    function appendTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot-message animate-message';
        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content typing-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessagesContainer.appendChild(msgDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        return msgDiv;
    }
}

// -------------------------------------------------------------
// DYNAMIC UI RENDERING FUNCTIONS
// -------------------------------------------------------------

// Render course grid explorer
function renderCourseGrid() {
    courseGrid.innerHTML = '';

    if (state.courses.length === 0) {
        courseGrid.innerHTML = `
            <div class="no-results-state">
                <i class="fa-solid fa-graduation-cap"></i>
                <h3>No Courses Found</h3>
                <p>Try refining your search terms or choosing a different department.</p>
            </div>
        `;
        return;
    }

    state.courses.forEach(course => {
        const isEnrolled = state.enrolledCourses.some(ec => ec.course_id === course.course_id);
        const percentFilled = (course.enrolled_count / course.capacity) * 100;
        
        // CSS class mappings for departments
        let deptClass = 'badge-cs';
        if (course.department === 'Mathematics') deptClass = 'badge-math';
        else if (course.department === 'Physics') deptClass = 'badge-physics';
        else if (course.department === 'Artificial Intelligence') deptClass = 'badge-aiml';
        else if (course.department === 'Civil Engineering') deptClass = 'badge-civil';
        else if (course.department === 'Mechanical Engineering') deptClass = 'badge-mech';

        // Capacity indicator colors
        let fillClass = '';
        if (percentFilled >= 90) fillClass = 'danger';
        else if (percentFilled >= 70) fillClass = 'warning';

        // Check if student's primary department matches the course department
        const isPrimaryMajorCourse = state.user && state.user.department === course.department;

        // Detect course type for tag rendering
        let courseType = 'Core';
        let typeClass = 'core';
        const titleLower = course.title.toLowerCase();
        const codeUpper = course.course_code.toUpperCase();
        
        if (titleLower.includes('lab') || titleLower.includes('laboratory') || codeUpper.endsWith('L') || codeUpper.includes('LAB')) {
            courseType = 'Lab';
            typeClass = 'lab';
        } else if (codeUpper.includes('EL') || titleLower.includes('elective') || codeUpper.includes('ELECT')) {
            courseType = 'Elective';
            typeClass = 'elective';
        }

        // Button logic
        let actionBtnHTML = '';
        if (isEnrolled) {
            actionBtnHTML = `
                <button class="btn btn-danger btn-block" onclick="dropCourse(${course.course_id}, '${course.title}')">
                    <i class="fa-solid fa-circle-minus"></i> Drop Course
                </button>
            `;
        } else if (course.enrolled_count >= course.capacity) {
            const waitlistItem = state.waitlist ? state.waitlist.find(w => w.course_id === course.course_id) : null;
            if (waitlistItem) {
                actionBtnHTML = `
                    <button class="btn btn-warning btn-block" onclick="leaveWaitlist(${course.course_id}, '${course.title}')">
                        <i class="fa-solid fa-clock-rotate-left"></i> Leave Waitlist (Pos #${waitlistItem.position})
                    </button>
                `;
            } else {
                actionBtnHTML = `
                    <button class="btn btn-warning btn-block" onclick="joinWaitlist(${course.course_id}, '${course.title}')">
                        <i class="fa-solid fa-clock"></i> Join Waitlist
                    </button>
                `;
            }
        } else {
            actionBtnHTML = `
                <button class="btn btn-primary btn-block" onclick="registerCourse(${course.course_id}, '${course.title}')">
                    <i class="fa-solid fa-circle-plus"></i> Register Course
                </button>
            `;
        }

        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="card-header-details">
                <span class="course-badge ${deptClass}">${course.department}</span>
                <span class="badge-type ${typeClass}">${courseType}</span>
                <span class="course-credits">${course.credits} Credits</span>
            </div>
            <h3 class="course-card-title">${course.title}</h3>
            <span class="course-card-code">${course.course_code} ${isPrimaryMajorCourse ? '<i class="fa-solid fa-star" title="Core Major Course" style="color:var(--warning); margin-left:4px;"></i>' : ''}</span>
            <p class="course-card-desc">${course.description}</p>
            
            <div class="course-card-instructor">
                <i class="fa-solid fa-circle-user instructor-icon"></i>
                <span>Instructor: <strong>${course.instructor}</strong></span>
            </div>

            <div class="capacity-tracker">
                <div class="capacity-text-row">
                    <span class="capacity-label">Seat Availability</span>
                    <span class="capacity-nums">${course.enrolled_count} / ${course.capacity} seats</span>
                </div>
                <div class="capacity-bar-bg">
                    <div class="capacity-bar-fill ${fillClass}" style="width: ${percentFilled}%"></div>
                </div>
            </div>

            ${actionBtnHTML}
        `;
        courseGrid.appendChild(card);
    });
}

// Render schedule sidebar
function renderEnrolledSidebar() {
    enrolledList.innerHTML = '';

    if (state.enrolledCourses.length === 0) {
        enrolledList.innerHTML = `
            <div class="empty-schedule">
                <i class="fa-solid fa-calendar-xmark empty-icon"></i>
                <h3>No classes registered yet</h3>
                <p>Search the catalog and select "Register" to add courses to your schedule.</p>
            </div>
        `;
        return;
    }

    state.enrolledCourses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'enrolled-item';
        item.innerHTML = `
            <div class="enrolled-info">
                <span class="enrolled-code">${course.course_code} (${course.credits} cr)</span>
                <span class="enrolled-title text-truncate">${course.title}</span>
                <span class="enrolled-sub-meta text-truncate"><i class="fa-solid fa-chalkboard-user"></i> ${course.instructor}</span>
            </div>
            <button class="btn btn-icon-only" style="border-radius: 8px; width:34px; height:34px; padding:0; flex-shrink: 0;" 
                    onclick="dropCourse(${course.course_id}, '${course.title}')" title="Drop Course">
                <i class="fa-solid fa-trash-can" style="color:var(--danger); font-size:0.85rem;"></i>
            </button>
        `;
        enrolledList.appendChild(item);
    });
}

// Update top statistics summary metrics
function updateStatsUI() {
    statCredits.textContent = state.totalCredits;

    // Update credits load progress bar towards 20 credit limit
    const creditPercent = (state.totalCredits / 20) * 100;
    creditsProgressBar.style.width = `${Math.min(100, creditPercent)}%`;

    // Visual warning indicators for credit loads
    creditsProgressBar.className = 'progress-bar'; // reset class list
    if (state.totalCredits === 20) {
        creditsProgressBar.classList.add('limit-danger');
    } else if (state.totalCredits >= 15) {
        creditsProgressBar.classList.add('limit-warning');
    }
}

// Fetch and render the B.Tech Degree course path
async function fetchAndRenderDegreePlan(selectedDept = null) {
    try {
        const url = selectedDept 
            ? `/api/degree-plan?department=${encodeURIComponent(selectedDept)}` 
            : '/api/degree-plan';
            
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch degree plan data');
        
        const data = await res.json();
        
        // Update department selector value
        const degreeDeptSelect = document.getElementById('degree-dept-select');
        if (degreeDeptSelect && !selectedDept) {
            degreeDeptSelect.value = data.department;
        }
        
        // Count metrics
        let completedCount = 0;
        let enrolledCount = 0;
        let plannedCount = 0;
        
        data.semesters.forEach(sem => {
            sem.courses.forEach(c => {
                if (c.status === 'completed') completedCount++;
                else if (c.status === 'enrolled') enrolledCount++;
                else plannedCount++;
            });
        });
        
        // Update credit bar
        const goalCredits = data.total_btech_credits || 160;
        const totalCreditsAccrued = data.total_completed_credits + data.total_enrolled_credits;
        const progressPercent = Math.min(100, Math.round((totalCreditsAccrued / goalCredits) * 100));
        
        const progressBar = document.getElementById('degree-progress-bar');
        const progressPercentEl = document.getElementById('degree-progress-percent');
        const completedText = document.getElementById('degree-credits-completed-text');
        
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
        if (completedText) {
            completedText.textContent = `${data.total_completed_credits} completed + ${data.total_enrolled_credits} enrolled of ${goalCredits} credits`;
        }
        
        // Update stats
        const completedCountEl = document.getElementById('degree-completed-count');
        const enrolledCountEl = document.getElementById('degree-enrolled-count');
        const plannedCountEl = document.getElementById('degree-planned-count');
        
        if (completedCountEl) completedCountEl.textContent = completedCount;
        if (enrolledCountEl) enrolledCountEl.textContent = enrolledCount;
        if (plannedCountEl) plannedCountEl.textContent = plannedCount;
        
        // Render Chart
        renderCreditChart(data);

        // Render semester cards
        const semestersGrid = document.getElementById('degree-semesters-grid');
        if (!semestersGrid) return;
        
        semestersGrid.innerHTML = '';
        
        const currentSem = (state.user && state.user.current_semester) ? parseInt(state.user.current_semester) : 1;

        data.semesters.forEach(sem => {
            const semCard = document.createElement('div');
            const isCurrent = parseInt(sem.semester) === currentSem;
            semCard.className = `glass-card semester-plan-card animate-on-load ${isCurrent ? '' : 'collapsed'}`;
            
            const semCredits = sem.courses.reduce((sum, c) => sum + c.credits, 0);
            
            let coursesHtml = '';
            sem.courses.forEach(c => {
                let statusBadge = '';
                if (c.status === 'completed') {
                    statusBadge = `<span class="badge-status completed"><i class="fa-solid fa-circle-check"></i> Done (${c.grade || 'P'})</span>`;
                } else if (c.status === 'enrolled') {
                    statusBadge = `<span class="badge-status enrolled"><i class="fa-solid fa-spinner fa-spin"></i> Active</span>`;
                } else {
                    statusBadge = `<span class="badge-status planned"><i class="fa-regular fa-clock"></i> Planned</span>`;
                }
                
                let typeClass = 'core';
                if (c.type.toLowerCase() === 'elective') typeClass = 'elective';
                else if (c.type.toLowerCase() === 'lab') typeClass = 'lab';
                
                const typeBadge = `<span class="badge-type ${typeClass}">${c.type}</span>`;
                
                coursesHtml += `
                    <div class="degree-course-item">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <span class="degree-course-title">${c.title}</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-color); white-space: nowrap;">${c.credits} Cr</span>
                        </div>
                        <div class="degree-course-meta">
                            <span class="degree-course-code">${c.course_code}</span>
                            <div class="degree-badges-row">
                                ${typeBadge}
                                ${statusBadge}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            semCard.innerHTML = `
                <div class="semester-plan-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentElement.classList.toggle('collapsed')">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-chevron-down toggle-chevron" style="transition: transform 0.3s ease; font-size: 0.85rem; color: var(--text-secondary);"></i>
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-color);">Semester ${sem.semester}</h3>
                    </div>
                    <span class="semester-credits-badge">${semCredits} Credits</span>
                </div>
                <div class="semester-plan-body">
                    ${coursesHtml}
                </div>
            `;
            
            semestersGrid.appendChild(semCard);
        });
        
    } catch (err) {
        console.error(err);
        showToast('Error loading B.Tech degree plan details', 'error');
    }
}

// Render the Credit Category Donut Chart
function renderCreditChart(data) {
    const ctx = document.getElementById('credit-distribution-chart');
    if (!ctx || !window.Chart) return;

    try {
        const isLightTheme = document.body.classList.contains('light-theme');
        const plannedColor = isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
        
        const completed = data.credit_distribution.completed;
        const enrolled = data.credit_distribution.enrolled;
        
        const coreVal = (completed.Core || 0) + (enrolled.Core || 0);
        const electiveVal = (completed.Elective || 0) + (enrolled.Elective || 0);
        const labVal = (completed.Lab || 0) + (enrolled.Lab || 0);
        
        const earnedTotal = coreVal + electiveVal + labVal;
        const goalCredits = data.total_btech_credits || 160;
        const remainingVal = Math.max(0, goalCredits - earnedTotal);

        if (window.creditChartInstance) {
            window.creditChartInstance.destroy();
        }

        window.creditChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Core', 'Elective', 'Lab', 'Remaining'],
                datasets: [{
                    data: [coreVal, electiveVal, labVal, remainingVal],
                    backgroundColor: [
                        '#06b6d4', // Core
                        '#f59e0b', // Elective
                        '#10b981', // Lab
                        plannedColor // Remaining
                    ],
                    borderColor: isLightTheme ? '#ffffff' : '#1e1e2f',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw} Credits`;
                            }
                        }
                    }
                }
            }
        });

        // Render Custom Legend
        const legendContainer = document.getElementById('credit-chart-legend');
        if (legendContainer) {
            legendContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #06b6d4;"></span>
                    <span>Core (${coreVal} Cr)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f59e0b;"></span>
                    <span>Elective (${electiveVal} Cr)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                    <span>Lab (${labVal} Cr)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${isLightTheme ? '#e5e7eb' : 'rgba(255,255,255,0.15)'};"></span>
                    <span>Remaining (${remainingVal} Cr)</span>
                </div>
            `;
        }
    } catch (e) {
        console.error('Error rendering credit chart:', e);
    }
}

// Fetch and render student wishlist waitlist status
async function fetchWaitlistStatus() {
    try {
        const res = await fetch('/api/waitlist/status');
        if (res.ok) {
            state.waitlist = await res.json();
            renderWaitlist();
            // Re-render course catalog cards because waitlist positions affect buttons
            renderCourseGrid();
        }
    } catch (err) {
        console.error('Failed to retrieve waitlist status:', err);
    }
}

// Render waitlist cards
function renderWaitlist() {
    const container = document.getElementById('waitlist-container');
    if (!container) return;
    
    if (state.waitlist.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); margin-top: 50px; font-size: 0.95rem;">
                <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                No waitlisted courses.
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    state.waitlist.forEach(item => {
        const card = document.createElement('div');
        card.className = 'waitlist-item-card animate-on-load';
        card.innerHTML = `
            <div class="waitlist-info">
                <div class="waitlist-title">${item.title}</div>
                <div class="waitlist-meta">
                    <span>${item.course_code}</span>
                    <span>&bull;</span>
                    <span>${item.credits} Credits</span>
                    <span>&bull;</span>
                    <span>Prof. ${item.instructor}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; margin-left: 10px;">
                <span class="waitlist-badge"><i class="fa-solid fa-user-clock"></i> Pos #${item.position}</span>
                <button class="btn btn-icon-only" style="border-radius: 8px; width:32px; height:32px; padding:0; flex-shrink: 0;"
                        onclick="leaveWaitlist(${item.course_id}, '${item.title}')" title="Leave Waitlist">
                    <i class="fa-solid fa-xmark" style="color:var(--danger); font-size:1rem;"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Join Course Waitlist action
async function joinWaitlist(courseId, courseTitle) {
    // Frontend validation: Check if course matches student's current semester
    let course = state.courses ? state.courses.find(c => c.course_id === courseId) : null;
    if (!course && state.recommendations) {
        course = state.recommendations.find(c => c.course_id === courseId);
    }
    const currentSemester = state.user ? state.user.current_semester : null;
    
    if (course && currentSemester && parseInt(course.semester) !== parseInt(currentSemester)) {
        showToast(`Waitlist denied. You can only register/waitlist for courses in your current semester (Semester ${currentSemester}).`, 'error');
        return;
    }

    try {
        const res = await fetch('/api/waitlist/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message, 'success');
            fetchWaitlistStatus();
        } else {
            showToast(data.error || 'Could not join waitlist.', 'error');
        }
    } catch (err) {
        showToast('Server connection error.', 'error');
    }
}

// Leave Course Waitlist action
async function leaveWaitlist(courseId, courseTitle) {
    if (!confirm(`Are you sure you want to leave the waitlist for "${courseTitle}"?`)) return;
    try {
        const res = await fetch('/api/waitlist/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message, 'success');
            fetchWaitlistStatus();
        } else {
            showToast(data.error || 'Could not leave waitlist.', 'error');
        }
    } catch (err) {
        showToast('Server connection error.', 'error');
    }
}

// Bind to window to guarantee inline onclick attributes accessibility
window.joinWaitlist = joinWaitlist;
window.leaveWaitlist = leaveWaitlist;
