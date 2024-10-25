// إعداد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// إعداد Firebase الخاص بك
const firebaseConfig = {
    apiKey: "AIzaSyCNlNpZZn-tkIRpOZXeOJqgnagNk9hRyqI",
    authDomain: "bing-8e48f.firebaseapp.com",
    databaseURL: "https://bing-8e48f-default-rtdb.firebaseio.com",
    projectId: "bing-8e48f",
    storageBucket: "bing-8e48f.appspot.com",
    messagingSenderId: "463368456917",
    appId: "1:463368456917:android:41612df40b1a4aa6e1f05c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage(app);

// تحديث صورة الملف الشخصي عند تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        // الحصول على بيانات المستخدم
        const uid = user.uid;
        const profileImage = document.getElementById('profileImage');
        const profileSideImage = document.getElementById('profileSideImage');

        // تحميل صورة الملف الشخصي من Firebase Storage
        const imageRef = ref(storage, `users/${uid}/profile.jpg`);
        getDownloadURL(imageRef).then((url) => {
            profileImage.src = url;
            profileSideImage.src = url;
        }).catch((error) => {
            console.error('حدث خطأ أثناء تحميل صورة الملف الشخصي:', error);
        });

    } else {
        // إذا لم يكن المستخدم مسجلاً الدخول، إعادة توجيه إلى صفحة تسجيل الدخول
        window.location.href = 'login.html';
    }
});

// تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('تم تسجيل الخروج بنجاح');
        window.location.href = 'login.html';  // إعادة التوجيه لصفحة تسجيل الدخول
    }).catch((error) => {
        console.error('حدث خطأ أثناء تسجيل الخروج:', error);
    });
});

document.getElementById('sideLogoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('تم تسجيل الخروج بنجاح');
        window.location.href = 'login.html';  // إعادة التوجيه لصفحة تسجيل الدخول
    }).catch((error) => {
        console.error('حدث خطأ أثناء تسجيل الخروج:', error);
    });
});

// التحكم في القائمة الجانبية
const menuButton = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');

// إضافة حدث عند الضغط على زر القائمة
menuButton.addEventListener('click', () => {
    sideMenu.classList.toggle('open');  // إضافة أو إزالة الفئة 'open' لإظهار أو إخفاء القائمة
});

// إضافة حدث إغلاق للقائمة الجانبية عند النقر على زر X
const closeBtn = document.getElementById('closeBtn');

closeBtn.addEventListener('click', () => {
    sideMenu.classList.remove('open');  // إزالة الفئة 'open' لإخفاء القائمة
});