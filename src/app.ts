// @ts-ignore: Could not find declaration file for module 'express'.
import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/connect.js";
import companyRouter from "./routes/companyRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import { connectKafka } from "./utils/producer.js";

dotenv.config();

const app = express();
app.use(express.json({
    limit: "100mb"}));
app.use(express.urlencoded({ extended: true }));

initDB();

connectKafka();

app.use('/api/v1/companies', companyRouter);
app.use('/api/v1/jobs', jobRouter);

export default app;