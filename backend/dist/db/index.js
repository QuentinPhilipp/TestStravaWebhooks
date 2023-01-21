"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
var admin = require("firebase-admin");
admin.initializeApp({
    credential: (0, app_1.cert)("./src/db/firebase-key.json")
});
const firestore = (0, firestore_1.getFirestore)();
exports.default = firestore;
//# sourceMappingURL=index.js.map