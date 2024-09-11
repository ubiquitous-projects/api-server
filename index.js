#!/usr/bin/env node

const apicache = require("apicache");
const colors = require("colors");
const cors = require("cors");
const express = require("express");
const express_rate_limit = require("express-rate-limit");
const needle = require("needle");
const url = require("url");

const limiter = express_rate_limit({
    max: 100,
    windowMs: 30 * 60 * 1000,
});

const app = express();

app.get(`/`, (request, response) => {
    response.status(200).json({ response: `Welcome to api-server.` });
    return;
});

app.set(`trust proxy`, 1);

app.use(cors());

app.use(limiter);

const api_cache = apicache.middleware;

const api_key_url = process.env.API_KEY_URL || "";

const api_key_name = process.env.API_KEY_NAME || "";

const api_key_value = process.env.API_KEY_VALUE || "";

const router = express.Router();

app.use(`/api`, async (request, response) => {
    try {
        router.get(
            `/`,
            api_cache(`3 minutes`),
            async (request, response, next) => {
                try {
                    const arguments = new URLSearchParams({
                        [api_key_name]: api_key_value,
                        ...url.parse(request.url, true).query,
                    });
                    const results = await needle(
                        `get`,
                        `${api_key_url}?${arguments}`
                    );
                    const data = results.body;
                    response.status(200).json(data);
                    return;
                } catch (err) {
                    next(err);
                }
            }
        );
    } catch (err) {
        console.error(err.message.brightRed);
        response
            .status(500)
            .json({ response: `Error proxy-serving your API key.` });
        return;
    }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(
        `api-server listening on port: `.brightWhite,
        `${port}`.brightGreen
    );
    return;
});
