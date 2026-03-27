>>> Steps to clone the repo : 
1. open vscode 
2. Press ctrl + ` to open the terminal 
3. write : git clone https://github.com/Vidushi-8465/Aarogya
4. Open Home.html using live server 
5. If you don't have a live server open it dorectly by double clicking on the file through folder. i.e folder pe jao fir file pe double click karo 


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhZO30WIjIQmOzWvaWQL0UfDAcJdqbKR0",
  authDomain: "aarogya-157d6.firebaseapp.com",
  databaseURL: "https://aarogya-157d6-default-rtdb.firebaseio.com",
  projectId: "aarogya-157d6",
  storageBucket: "aarogya-157d6.firebasestorage.app",
  messagingSenderId: "1036448126211",
  appId: "1:1036448126211:web:ce963f482b6fd0e17a4536"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);