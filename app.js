// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// تكوين Firebase
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
const storage = getStorage(app);
const auth = getAuth();

// التحقق من حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.setItem('loggedInUser', user.uid);
        localStorage.setItem('userEmail', user.email);
        displayUserProfile(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

function displayUserProfile(userId) {
    const profileImageElement = document.getElementById('profileImage');
    const userNameElement = document.getElementById('userName');
    const userIdElement = document.getElementById('userId');

    const userRef = ref(db, `users/${userId}`);
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            profileImageElement.src = userData.profileImage || 'default-avatar.png';
            userNameElement.textContent = userData.userName || 'مستخدم مجهول';
            userIdElement.textContent = userData.userId || 'unknown';

            profileImageElement.style.cursor = "pointer";
            profileImageElement.onclick = () => {
                window.location.href = `profile.html?userId=${userId}`;
            };
        } else {
            console.warn("بيانات المستخدم غير موجودة.");
        }
    }).catch((error) => {
        console.error("خطأ في جلب بيانات المستخدم:", error);
    });
}

// زر تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
});

// عناصر رفع الصور
const imageUpload = document.getElementById("imageUpload");
const imageTitle = document.getElementById("imageTitle");
const uploadBtn = document.getElementById("uploadBtn");
const uploadProgress = document.getElementById("uploadProgress");
const imageGallery = document.getElementById("imageGallery");
const uploadModal = document.getElementById("uploadModal");
const addImageBtn = document.getElementById("addImageBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// فتح نافذة تحميل الصور
addImageBtn.addEventListener("click", () => {
    uploadModal.style.display = "block";
});

// إغلاق نافذة تحميل الصور
closeModalBtn.addEventListener("click", () => {
    uploadModal.style.display = "none";
});

// تحميل الصورة إلى Firebase مع شريط تقدم
uploadBtn.addEventListener("click", async () => {
    const file = imageUpload.files[0];
    const title = imageTitle.value;
    const userId = localStorage.getItem('loggedInUser');
    const userEmail = localStorage.getItem('userEmail');

    if (file && title && userId && userEmail) {
        const storageReference = storageRef(storage, `images/${file.name}`);
        const uploadTask = uploadBytesResumable(storageReference, file);

        // تحديث شريط التقدم
        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgress.value = progress;
        }, (error) => {
            alert(error.message);
        }, async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // جلب معلومات المستخدم من قاعدة البيانات باستخدام user.uid
            const userRef = ref(db, `users/${userId}`);
            const userSnapshot = await get(userRef);
            let userName = "مستخدم مجهول";

            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                userName = userData.userName || "مستخدم مجهول";
            }

            // إنشاء معرف الصورة
            const imageID = `${userId}_${Date.now()}`;

            // تخزين بيانات الصورة مع معرف المستخدم
            await set(ref(db, `Images/${imageID}`), {
                title: title,
                url: downloadURL,
                userId: userId,  // تخزين userId من Firebase
                userName: userName,  // اسم المستخدم من قاعدة البيانات
                userEmail: userEmail,
                likes: 0,
                comments: [],
                views: 0
            });

            alert("تم رفع الصورة بنجاح!");
            loadImages();
            uploadModal.style.display = "none";
        });
    } else {
        alert("يرجى اختيار صورة وإدخال عنوان.");
    }
});

// تحميل وعرض الصور مع احتساب المشاهدات والإعجابات
async function loadImages() {
    const dbRef = ref(db, "Images/");
    const currentUserId = localStorage.getItem('loggedInUser'); // جلب معرف المستخدم الحالي

    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            imageGallery.innerHTML = "";
            const images = snapshot.val();
            Object.keys(images).forEach(async (imageId) => {
                const imageData = images[imageId];

                // جلب بيانات المستخدم
                const userRef = ref(db, `users/${imageData.userId}`);
                const userSnapshot = await get(userRef);
                let username = "مستخدم مجهول";
                let profileImageUrl = "default-avatar.png";

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    username = userData.userName || "مستخدم مجهول";
                    profileImageUrl = userData.profileImage || "default-avatar.png";
                }

                const imgElement = document.createElement("div");
                imgElement.classList.add("image-card");
                imgElement.innerHTML = `
                    <div class="post-header">
                        <img src="${profileImageUrl}" alt="${username}" class="profile-img" data-user-id="${imageData.userId}">
                        <div class="user-info" data-user-id="${imageData.userId}">
                            <p class="username">${username}</p>
                            <p class="user-id">${imageData.userId}</p>
                        </div>
                    </div>
                    <h3>${imageData.title}</h3>
                    <img src="${imageData.url}" alt="${imageData.title}" class="image-view" data-image-id="${imageId}">
                    <button class="like-btn" data-liked="false" data-image-id="${imageId}">إعجاب</button>
                    <p>الإعجابات: <span class="like-count">${imageData.likes}</span></p>
                    <p>المشاهدات: <span class="views-count">${imageData.views}</span></p>
                `;

                imageGallery.appendChild(imgElement);

                // تحديث عدد المشاهدات عند عرض الصورة
                const imageElement = imgElement.querySelector('.image-view');
                incrementViews(imageId, imgElement);
                
                // إضافة خاصية النقر على الصورة للانتقال إلى صفحة post.html
                imageElement.onclick = () => {
                    window.location.href = `post.html?imageId=${imageId}`;
                };


                // التعامل مع زر الإعجاب
                const likeBtn = imgElement.querySelector('.like-btn');
                const likeCountElement = imgElement.querySelector('.like-count');

                // التحقق إذا قام المستخدم بالفعل بالإعجاب بهذه الصورة
                const userLikesRef = ref(db, `Images/${imageId}/likedBy/${currentUserId}`);
                const userLikeSnapshot = await get(userLikesRef);

                if (userLikeSnapshot.exists()) {
                    likeBtn.innerHTML = `<img src="icons/Like1.png" alt="إلغاء الإعجاب" class="like-icon">`;
                    likeBtn.dataset.liked = "true";
                }

                likeBtn.onclick = async () => {
                    const isLiked = likeBtn.dataset.liked === "true";

                    if (isLiked) {
                        // إلغاء الإعجاب
                        await update(ref(db, `Images/${imageId}`), {
                            likes: imageData.likes - 1
                        });

                        // إزالة المستخدم من قائمة الذين أعجبوا
                        await update(ref(db, `Images/${imageId}/likedBy`), {
                            [currentUserId]: null
                        });

                        likeBtn.innerHTML = `<img src="icons/Like.png" alt="إعجاب" class="like-icon">`;
                        likeBtn.dataset.liked = "false";
                        likeCountElement.textContent = imageData.likes - 1;
                    } else {
                        // إضافة الإعجاب
                        await update(ref(db, `Images/${imageId}`), {
                            likes: imageData.likes + 1
                        });

                        // إضافة المستخدم إلى قائمة الذين أعجبوا
                        await update(ref(db, `Images/${imageId}/likedBy`), {
                            [currentUserId]: true
                        });

                        likeBtn.innerHTML = `<img src="icons/Like1.png" alt="إلغاء الإعجاب" class="like-icon">`;
                        likeBtn.dataset.liked = "true";
                        likeCountElement.textContent = imageData.likes + 1;
                    }
                };

                // إضافة خاصية النقر على صورة الملف الشخصي أو اسم المستخدم
                const profileImg = imgElement.querySelector('.profile-img');
                const userInfo = imgElement.querySelector('.user-info');
                profileImg.onclick = () => {
                    window.location.href = `profile.html?userId=${profileImg.dataset.userId}`;
                };
                userInfo.onclick = () => {
                    window.location.href = `profile.html?userId=${userInfo.dataset.userId}`;
                };

                // تحديث عدد المشاهدات عند النقر على الصورة
                imageElement.onclick = () => {
                    incrementViews(imageId, imgElement);
                };
                
                // إضافة خاصية النقر على الصورة للانتقال إلى صفحة post.html
                imageElement.onclick = () => {
                    window.location.href = `post.html?imageId=${imageId}`; // توجيه إلى post.html مع معرف الصورة
                };
            });
        } else {
            imageGallery.innerHTML = "<p>لا توجد صور متاحة.</p>";
        }
    } catch (error) {
        console.error("خطأ في تحميل الصور:", error);
        imageGallery.innerHTML = "<p>حدث خطأ في تحميل الصور.</p>";
    }
}

// دالة لزيادة عدد الإعجابات وإرسالها إلى قاعدة البيانات
async function incrementLikes(imageId, imgElement) {
    const imageRef = ref(db, `Images/${imageId}`);
    try {
        const snapshot = await get(imageRef);
        if (snapshot.exists()) {
            const imageData = snapshot.val();
            const newLikesCount = (imageData.likes || 0) + 1;

            // تحديث عدد الإعجابات في قاعدة البيانات
            await update(imageRef, { likes: newLikesCount });

            // تحديث عدد الإعجابات في واجهة المستخدم
            const likesCountElement = imgElement.querySelector(".likes-count");
            likesCountElement.textContent = newLikesCount;
        } else {
            console.warn(`الصورة بمعرف ${imageId} غير موجودة.`);
        }
    } catch (error) {
        console.error("خطأ في تحديث عدد الإعجابات:", error);
    }
}

// دالة لزيادة عدد المشاهدات وإرسالها إلى قاعدة البيانات
async function incrementViews(imageId, imgElement) {
    const imageRef = ref(db, `Images/${imageId}`);
    try {
        const snapshot = await get(imageRef);
        if (snapshot.exists()) {
            const imageData = snapshot.val();
            const newViewsCount = (imageData.views || 0) + 1;

            // تحديث عدد المشاهدات في قاعدة البيانات
            await update(imageRef, { views: newViewsCount });

            // تحديث عدد المشاهدات في واجهة المستخدم
            const viewsCountElement = imgElement.querySelector(".views-count");
            viewsCountElement.textContent = newViewsCount;
        } else {
            console.warn(`الصورة بمعرف ${imageId} غير موجودة.`);
        }
    } catch (error) {
        console.error("خطأ في تحديث عدد المشاهدات:", error);
    }
}

// استدعاء تحميل الصور عند تحميل الصفحة
window.onload = loadImages;