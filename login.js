import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// تهيئة Firebase باستخدام بيانات المشروع
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
const auth = getAuth(app);
const storage = getStorage(app);
const db = getDatabase(app);

// إعداد Google Provider لتسجيل الدخول
const provider = new GoogleAuthProvider();

// إخفاء/إظهار واجهات تسجيل الدخول وإنشاء الحساب
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');

    // إظهار واجهة إنشاء الحساب وإخفاء تسجيل الدخول
    showRegisterBtn.addEventListener('click', () => {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    // إظهار واجهة تسجيل الدخول وإخفاء إنشاء الحساب
    showLoginBtn.addEventListener('click', () => {
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // تسجيل الدخول باستخدام Google
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                const displayName = user.displayName;
                const email = user.email;
                const photoURL = user.photoURL;

                await set(ref(db, 'users/' + user.uid), {
                    displayName: displayName,
                    email: email,
                    profileImage: photoURL || null
                });

                console.log('تم تسجيل الدخول باستخدام Google بنجاح:', user);
                alert('تم تسجيل الدخول بنجاح!');
                window.location.href = 'user-id.html';
            } catch (error) {
                console.error('خطأ في تسجيل الدخول باستخدام Google:', error);
                alert('خطأ في تسجيل الدخول باستخدام Google: ' + error.message);
            }
        });
    }

    // تسجيل الدخول التقليدي
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email.trim() || !password.trim()) {
                alert("يرجى ملء جميع الحقول المطلوبة.");
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log('تم تسجيل الدخول بنجاح:', user);
                alert('تم تسجيل الدخول بنجاح!');
                window.location.href = 'user-id.html';
            } catch (error) {
                console.error('خطأ في تسجيل الدخول:', error);
                alert('خطأ في تسجيل الدخول: ' + error.message);
            }
        });
    }

    // إنشاء حساب جديد باستخدام Google
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                const displayName = user.displayName;
                const email = user.email;
                const photoURL = user.photoURL;

                await set(ref(db, 'users/' + user.uid), {
                    displayName: displayName,
                    email: email,
                    profileImage: photoURL || null
                });

                console.log('تم إنشاء الحساب باستخدام Google بنجاح:', user);
                alert('تم إنشاء الحساب بنجاح!');
                window.location.href = 'user-id.html';
            } catch (error) {
                console.error('خطأ أثناء إنشاء الحساب باستخدام Google:', error);
                alert('خطأ أثناء إنشاء الحساب باستخدام Google: ' + error.message);
            }
        });
    }
});