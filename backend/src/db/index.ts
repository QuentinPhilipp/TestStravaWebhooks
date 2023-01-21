import { cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore';


var admin = require("firebase-admin");

admin.initializeApp({
  credential: cert("./src/db/firebase-key.json")
});

const firestore = getFirestore();

export default firestore;