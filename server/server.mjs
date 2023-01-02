import express from 'express'
import path from 'path'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import cookieParser from 'cookie-parser';


const app = express()
const port = process.env.PORT || 5426
const mongodbURI = process.env.mongodbURI || "mongodb+srv://login-signup:login-signup@cluster0.pu4fwyo.mongodb.net/Login-SignUp?retryWrites=true&w=majority"
const SECRET = process.env.SECRET || "Thesharedsecretmustbeatleast32bytesinlength";


app.use(express.json())
app.use(cookieParser())
mongoose.connect(mongodbURI)
app.use(cors({
    origin: ['http://localhost:3000', "*"],
    credentials: true
}));


// ----------------------------------- MongoDB -----------------------------------
let userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true, unique: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdOn: { type: Date, default: Date.now }
})
const userModel = mongoose.model('Users', userSchema);
// ----------------------------------- MongoDB -----------------------------------


// ----------------------------------- SignUp -----------------------------------
app.post('/signup', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase();
        const password = req.body.password
        userModel.findOne({ email: email }, async (error, user) => {
            if (!error) {
                if (user) {
                    console.log("User already exist: ", user);
                    res.status(409).send({
                        message: "User already exists. Please try a different email"
                    });
                    return;
                } else {
                    const hashPassword = await bcrypt.hash(password, 10)
                    // console.log(hashPassword)
                    userModel.create({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        age: req.body.age,
                        email: req.body.email,
                        gender: req.body.gender,
                        phone: req.body.phone,
                        password: hashPassword,
                    })
                    res.status(201).send(
                        `User Created`
                    )
                }
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
})
// ----------------------------------- SignUp -----------------------------------


// ----------------------------------- Login -----------------------------------
app.post("/login", (req, res) => {
    try {
        const email = req.body.email.toLowerCase();
        const password = req.body.password;
        userModel.findOne({ email }, async (error, user) => {
            if (!error) {
                if (user) {
                    const isValid = await bcrypt.compare(password, user.password)
                    if (isValid) {
                        const token = jwt.sign({ _id: user._id, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, SECRET)
                        res.cookie("Cookie", token, { maxAge: 86_400_000, httpOnly: true })
                        res.status(200).send('User Found')
                    } else {
                        res.status(401).send('Wrong Password')
                    }
                } else {
                    res.status(404).send('User not Found')
                }
            } else {
                res.status(401).send("Login Failed, Please try later");
                return;
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
})
// ----------------------------------- Login -----------------------------------


////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
    // process.exit(1);
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////


// const __dirname = path.resolve()
// const staticPath = path.join(__dirname, '../client/build')
// console.log("PATH-------",staticPath)
// app.use('/'.express.static(staticPath))
// app.use('*'.express.static(staticPath))


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
