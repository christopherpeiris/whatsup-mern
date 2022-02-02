// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
	appId: "1199696",
	key: "f17cd9ccc6f8bd351052",
	secret: "9fd01515bf9758e50c32",
	cluster: "eu",
	useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
// 	res.sendHeader("Access-Control-Allow-Origin", "*");
// 	res.sendHeader("Access-Control-Allow-Headers", "*");
// 	next();
// });

// DB config
const dbUrl =
	"mongodb+srv://admin:Z0xsjWLnQONBZOxo@cluster0.mjspb.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(dbUrl, {
	useCreateIndex: true,
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
	console.log("DB is connected");

	const msgCollection = db.collection("messagecontents");
	const changeStream = msgCollection.watch();

	changeStream.on("change", (change) => {
		console.log("change", change);

		if (change.operationType === "insert") {
			const messageDetails = change.fullDocument;
			pusher.trigger("messages", "inserted", {
				name: messageDetails.name,
				message: messageDetails.message,
				timestamp: messageDetails.timestamp,
				received: messageDetails.received,
			});
		} else {
			console.log("Error triggering Pusher");
		}
	});
});

// ???

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
	Messages.find((err, data) => {
		if (err) {
			res.status(500).send(err);
		} else {
			res.status(200).send(data);
		}
	});
});

app.post("/messages/new", (req, res) => {
	const dbMessage = req.body;

	Messages.create(dbMessage, (err, data) => {
		if (err) {
			res.status(500).send(err);
		} else {
			res.status(201).send(data);
		}
	});
});

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
