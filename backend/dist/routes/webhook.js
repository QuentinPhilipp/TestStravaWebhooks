"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoute = void 0;
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../logger"));
exports.webhookRoute = (0, express_1.Router)();
// Authorize webhook
exports.webhookRoute.get('/', (req, res) => {
    // Your verify token. Should be a random string.
    console.log("registering webhook");
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    // Parses the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Verifies that the mode and token sent are valid
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.json({ "hub.challenge": challenge });
        }
        else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});
// Strava webhooks
// Creates the endpoint for our webhook
exports.webhookRoute.post('/', (req, res) => {
    processCallback(req);
    res.status(200).send('EVENT_RECEIVED');
});
function processCallback(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const type = req.body.object_type;
        // don't register athlete events for now.   
        if (type === 'activity') {
            const activityID = req.body.object_id;
            logger_1.default.info(`register webhook for activityID: ${activityID}`);
            const docRef = db_1.default.collection('activities').doc(activityID.toString());
            yield docRef.set(req.body);
        }
    });
}
//# sourceMappingURL=webhook.js.map