// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
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
const auth = getAuth(app);

// الحصول على imageId من عنوان URL
const urlParams = new URLSearchParams(window.location.search);
const imageId = urlParams.get('imageId');

// استرجاع البيانات من Firebase
const dbRef = ref(db, 'Images/' + imageId);
get(dbRef).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
        // عرض الصورة والمعلومات
        document.getElementById('imageTitle').textContent = data.title;
        document.getElementById('image').src = data.url;
        document.getElementById('likes').textContent = data.likes;
        document.getElementById('views').textContent = data.views;

        // تحميل معلومات المستخدم (اسم المستخدم وصورة الملف الشخصي)
        loadUserProfile(data.userId);
        loadComments(); // تحميل التعليقات عند استرجاع البيانات
    } else {
        console.log('الصورة غير موجودة');
    }
}).catch((error) => {
    console.error('حدث خطأ أثناء جلب البيانات:', error);
});

// تحميل معلومات المستخدم
function loadUserProfile(userId) {
    const userRef = ref(db, `users/${userId}`);
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            // عرض صورة الملف الشخصي واسم المستخدم
            document.getElementById('userName').textContent = userData.userName || 'مستخدم مجهول';
            const profileImageElement = document.createElement('img');
            profileImageElement.src = userData.profileImage || 'default-avatar.png';
            profileImageElement.alt = "صورة الملف الشخصي";
            profileImageElement.style.width = "50px"; // ضبط العرض
            profileImageElement.style.height = "50px"; // ضبط الطول
            profileImageElement.style.borderRadius = "50%"; // جعل الصورة دائرية
            profileImageElement.style.marginLeft = "10px"; // هامش إلى اليسار
            
            const userInfoContainer = document.getElementById('userInfoContainer');
            userInfoContainer.innerHTML = ''; // تنظيف الحاوية
            userInfoContainer.appendChild(profileImageElement); // إضافة الصورة
            userInfoContainer.appendChild(document.createTextNode(userData.userName || 'مستخدم مجهول')); // إضافة اسم المستخدم
        } else {
            console.warn("بيانات المستخدم غير موجودة.");
        }
    }).catch((error) => {
        console.error("خطأ في جلب بيانات المستخدم:", error);
    });
}

// تحميل تفاصيل الصورة
async function loadPost(imageId) {
    const cachedPost = localStorage.getItem(`post_${imageId}`);
    
    if (cachedPost) {
        displayPost(JSON.parse(cachedPost));
    } else {
        const postRef = ref(db, `Images/${imageId}`);
        
        try {
            const snapshot = await get(postRef);
            if (snapshot.exists()) {
                const postData = snapshot.val();
                localStorage.setItem(`post_${imageId}`, JSON.stringify(postData));
                displayPost(postData);
            } else {
                console.error("لا توجد بيانات للمنشور.");
                document.getElementById('postContainer').innerHTML = "<p>لا توجد بيانات للمنشور.</p>";
            }
        } catch (error) {
            console.error("خطأ في جلب البيانات:", error);
            document.getElementById('postContainer').innerHTML = "<p>حدث خطأ أثناء جلب البيانات. حاول مرة أخرى لاحقًا.</p>";
        }
    }
}

// عرض تفاصيل الصورة
function displayPost(postData) {
    // عرض الصورة والعنوان
    document.getElementById('image').src = postData.url;
    document.getElementById('likes').textContent = postData.likes;
    document.getElementById('views').textContent = postData.views;

    // إعداد زر تحميل الصورة
    setupDownloadButton(postData.url);
    
    // تحديث التعليقات
    loadComments();
    setupCommentButton();
}

// إعداد زر تحميل الصورة
function setupDownloadButton(imageUrl) {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', () => {
        // إنشاء رابط التحميل
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'صورة.jpg'; // تحديد اسم الصورة التي سيتم تحميلها
        
        // إضافة الرابط إلى DOM
        document.body.appendChild(link);
        link.click(); // محاكاة النقر على الرابط
        document.body.removeChild(link); // إزالة الرابط من DOM بعد التحميل
    });
}

// تحميل التعليقات
function loadComments() {
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = "<p>جاري تحميل التعليقات...</p>";

    const commentsRef = ref(db, `Images/${imageId}/comments`);
    
    get(commentsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const comments = snapshot.val();
            commentsContainer.innerHTML = ""; // تنظيف الحاوية قبل إضافة التعليقات
            
            // عرض التعليقات
            for (const key in comments) {
                displayComment(comments[key]);
            }
        } else {
            commentsContainer.innerHTML = "<p>لا توجد تعليقات بعد.</p>";
        }
    }).catch((error) => {
        console.error("حدث خطأ أثناء جلب التعليقات:", error);
    });
}

// دالة لعرض تعليق
function displayComment(commentData) {
    const commentsContainer = document.getElementById('commentsContainer');
    
    // إنشاء عنصر للتعليق
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");
    
    // إنشاء صورة الملف الشخصي
    const profileImageElement = document.createElement('img');
    profileImageElement.src = commentData.profileImage || 'default-avatar.png';
    profileImageElement.alt = "صورة الملف الشخصي";
    profileImageElement.style.width = "30px"; // ضبط العرض
    profileImageElement.style.height = "30px"; // ضبط الطول
    profileImageElement.style.borderRadius = "50%"; // جعل الصورة دائرية
    profileImageElement.style.marginRight = "10px"; // هامش إلى اليمين
    
    // إنشاء عنصر لاسم المستخدم
    const userNameElement = document.createElement("span");
    userNameElement.textContent = commentData.userName || 'مستخدم مجهول';
    
    // إنشاء عنصر للتعليق نفسه
    const textElement = document.createElement("p");
    textElement.textContent = commentData.text;
    
    // تجميع العناصر
    commentElement.appendChild(profileImageElement);
    commentElement.appendChild(userNameElement);
    commentElement.appendChild(textElement);
    
    // إضافة التعليق إلى الحاوية
    commentsContainer.appendChild(commentElement);
}

// إعداد زر إضافة تعليق
function setupCommentButton() {
    const addCommentBtn = document.getElementById('addCommentBtn');
    const commentInput = document.getElementById('commentInput');
    
    // التحقق من حالة تسجيل الدخول
    onAuthStateChanged(auth, (user) => {
        if (user) {
            addCommentBtn.disabled = false; // تفعيل زر إضافة تعليق إذا كان المستخدم مسجلاً دخوله
        } else {
            addCommentBtn.disabled = true; // تعطيل زر إضافة تعليق إذا لم يكن المستخدم مسجلاً دخوله
            alert("يرجى تسجيل الدخول لإضافة تعليق.");
        }
    });

    addCommentBtn.addEventListener('click', async () => {
        const newCommentText = sanitizeInput(commentInput.value.trim());
        if (newCommentText) {
            // تعطيل الزر أثناء إضافة التعليق
            addCommentBtn.disabled = true;
            addCommentBtn.textContent = "جاري الإضافة...";
            
            const commentsRef = ref(db, `Images/${imageId}/comments`);
            const newCommentRef = push(commentsRef); // استخدام push لإضافة تعليق جديد
            
            // استرجاع معلومات المستخدم
            const user = auth.currentUser;
            const userRef = ref(db, `users/${user.uid}`);
            const userData = await get(userRef);

            // إعداد البيانات الجديدة
            const newCommentData = {
                text: newCommentText,
                userId: user.uid, // إضافة userId
                profileImage: userData.val().profileImage || 'default-avatar.png', // صورة الملف الشخصي
                userName: userData.val().userName || 'مستخدم مجهول' // اسم المستخدم
            };

            // إضافة التعليق إلى قاعدة البيانات
            try {
                await set(newCommentRef, newCommentData);
                commentInput.value = ''; // تفريغ حقل الإدخال
                loadComments(); // إعادة تحميل التعليقات بعد الإضافة
            } catch (error) {
                console.error("خطأ أثناء إضافة التعليق:", error);
            } finally {
                // إعادة تفعيل الزر
                addCommentBtn.disabled = false;
                addCommentBtn.textContent = "أضف تعليق";
            }
        } else {
            alert("يرجى كتابة تعليق قبل الإضافة.");
        }
    });
}

// دالة لتعقيم المدخلات
function sanitizeInput(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML; // إرجاع المدخلات المعقمة
}

// بدء التطبيق
loadPost(imageId);