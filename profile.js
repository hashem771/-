// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNlNpZZn-tkIRpOZXeOJqgnagNk9hRyqI",
    authDomain: "bing-8e48f.firebaseapp.com",
    databaseURL: "https://bing-8e48f-default-rtdb.firebaseio.com",
    projectId: "bing-8e48f",
    storageBucket: "bing-8e48f.appspot.com",
    messagingSenderId: "463368456917",
    appId: "1:463368456917:android:41612df40b1a4aa6e1f05c"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// ذاكرة مؤقتة لحفظ بيانات المستخدمين
const userCache = {};

// تأكد من أن DOM جاهز قبل تشغيل أي كود
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userIdFromUrl = getUserIdFromUrl(); // جلب معرف المستخدم من الرابط
            if (userIdFromUrl) {
                displayUserProfile(userIdFromUrl); // عرض بيانات المستخدم بناءً على معرف الرابط
                loadUserPosts(userIdFromUrl); // جلب المنشورات الخاصة بالمستخدم بناءً على معرف الرابط
                checkFollowStatus(user.uid, userIdFromUrl); // التحقق من حالة المتابعة
                setupFollowButton(user.uid, userIdFromUrl); // إعداد زر المتابعة
                loadFollowerCount(userIdFromUrl); // جلب عدد المتابعين
            } else {
                console.error('معرف المستخدم غير موجود في الرابط');
            }
        } else {
            window.location.href = 'login.html'; // إعادة توجيه المستخدم لتسجيل الدخول
        }
    });
});

// قراءة userId من الرابط
function getUserIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
}

// عرض بيانات الملف الشخصي مع استخدام ذاكرة مؤقتة
function displayUserProfile(userId) {
    const profileNameElement = document.getElementById('profileName');
    const profileImageElement = document.getElementById('profileImage');

    if (!profileNameElement || !profileImageElement) {
        console.error("عناصر DOM المطلوبة غير موجودة.");
        return;
    }

    // التحقق مما إذا كانت البيانات موجودة في الذاكرة المؤقتة
    if (userCache[userId]) {
        const userData = userCache[userId];
        profileNameElement.textContent = userData.userName || "اسم المستخدم غير متوفر";
        profileImageElement.src = userData.profileImage || 'default-avatar.png';
    } else {
        const userRef = ref(db, `users/${userId}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                userCache[userId] = userData; // تخزين البيانات في الذاكرة المؤقتة
                profileNameElement.textContent = userData.userName || "اسم المستخدم غير متوفر";
                profileImageElement.src = userData.profileImage || 'default-avatar.png';
            } else {
                console.error("المستخدم غير موجود.");
            }
        }).catch((error) => {
            console.error("خطأ في جلب بيانات المستخدم:", error);
        });
    }
}

// جلب عدد المتابعين
function loadFollowerCount(userId) {
    const followersCountElement = document.getElementById('followersCount'); // تحديث المعرف ليطابق العنصر في HTML
    const followersRef = ref(db, `followers/${userId}`);

    if (!followersCountElement) {
        console.error("عنصر DOM followersCount غير موجود.");
        return;
    }

    onValue(followersRef, (snapshot) => {
        if (snapshot.exists()) {
            const followers = snapshot.val();
            const count = Object.keys(followers).length;
            followersCountElement.textContent = `عدد المتابعين: ${count}`;
        } else {
            followersCountElement.textContent = 'عدد المتابعين: 0';
        }
    });
}

// جلب منشورات المستخدم مع استخدام جلب بيانات المستخدمين دفعة واحدة
function loadUserPosts(userId) {
    const postsContainer = document.getElementById('postsContainer');
    const postsRef = ref(db, 'Images');

    if (!postsContainer) {
        console.error("عنصر DOM postsContainer غير موجود.");
        return;
    }

    get(postsRef).then((snapshot) => {
        if (snapshot.exists()) {
            postsContainer.innerHTML = ''; // مسح المحتوى السابق
            const posts = snapshot.val();
            let hasPosts = false;
            const userIds = new Set(); // لجمع جميع معرفات المستخدمين

            // جلب معرفات المستخدمين المرتبطة بالمنشورات
            Object.keys(posts).forEach((postId) => {
                const post = posts[postId];
                if (post.userId === userId) {
                    userIds.add(post.userId);
                }
            });

            // جلب بيانات جميع المستخدمين دفعة واحدة
            const userFetchPromises = Array.from(userIds).map(userId => {
                if (userCache[userId]) {
                    return Promise.resolve({ userId, data: userCache[userId] });
                } else {
                    const userRef = ref(db, `users/${userId}`);
                    return get(userRef).then(snapshot => {
                        const userData = snapshot.val();
                        userCache[userId] = userData; // تخزين البيانات في الذاكرة المؤقتة
                        return { userId, data: userData };
                    });
                }
            });

            // بعد جلب بيانات المستخدمين، قم بإنشاء المنشورات
            Promise.all(userFetchPromises).then(userDataArray => {
                Object.keys(posts).forEach((postId) => {
                    const post = posts[postId];
                    if (post.userId === userId) {
                        hasPosts = true;
                        const postElement = document.createElement('div');
                        postElement.className = 'post';

                        // إضافة معرف الصورة
                        const imageId = postId;

                        // بيانات المستخدم للمنشور
                        const userData = userCache[post.userId];

                        // إنشاء محتوى المنشور
                        postElement.innerHTML = `
                            <h3>${post.title || "عنوان غير متوفر"}</h3>
                            <img src="${post.url || 'default-image.png'}" alt="${post.title || 'صورة غير متوفرة'}" class="post-image">
                            <p>الإعجابات: ${post.likes || 0}</p>
                            <p>المشاهدات: ${post.views || 0}</p>
                            <p>المستخدم: ${userData.userName || 'مستخدم غير معروف'}</p>
                        `;

                        // إضافة خاصية النقر على الصورة للانتقال إلى صفحة post.html
                        const imageElement = postElement.querySelector('.post-image');
                        imageElement.onclick = () => {
                            window.location.href = `post.html?imageId=${imageId}`;
                        };

                        postsContainer.appendChild(postElement);
                    }
                });

                if (!hasPosts) {
                    postsContainer.innerHTML = '<p>لا توجد منشورات لهذا المستخدم.</p>';
                }
            });
        } else {
            postsContainer.innerHTML = '<p>لا توجد منشورات.</p>';
        }
    }).catch((error) => {
        console.error("خطأ في جلب المنشورات:", error);
        postsContainer.innerHTML = '<p>حدث خطأ في تحميل المنشورات.</p>';
    });
}

// التحقق من حالة المتابعة
function checkFollowStatus(currentUserId, targetUserId) {
    const followButton = document.getElementById('followBtn');
    const followRef = ref(db, `follows/${currentUserId}/${targetUserId}`);

    if (!followButton) {
        console.error("عنصر DOM followButton غير موجود.");
        return;
    }

    onValue(followRef, (snapshot) => {
        followButton.textContent = snapshot.exists() ? 'إلغاء المتابعة' : 'متابعة';
    });
}

// إعداد زر المتابعة
function setupFollowButton(currentUserId, targetUserId) {
    const followButton = document.getElementById('followBtn');

    if (!followButton) {
        console.error("عنصر DOM followButton غير موجود.");
        return;
    }

    followButton.addEventListener('click', () => {
        const followRef = ref(db, `follows/${currentUserId}/${targetUserId}`);
        const followersRef = ref(db, `followers/${targetUserId}/${currentUserId}`);

        get(followRef).then((snapshot) => {
            if (snapshot.exists()) {
                // إلغاء المتابعة
                remove(followRef).then(() => {
                    remove(followersRef).then(() => {
                        console.log('تم إلغاء المتابعة بنجاح');
                    });
                    }).catch((error) => {
                    console.error('حدث خطأ أثناء إلغاء المتابعة:', error);
                });
            } else {
                // المتابعة
                set(followRef, true).then(() => {
                    set(followersRef, true).then(() => {
                        console.log('تمت المتابعة بنجاح');
                    });
                }).catch((error) => {
                    console.error('حدث خطأ أثناء المتابعة:', error);
                });
            }
        }).catch((error) => {
            console.error('حدث خطأ أثناء التحقق من حالة المتابعة:', error);
        });
    });
} 