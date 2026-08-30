require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const logger = require("./utils/logger");
const swaggerDocument = require("./docs/swagger");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const entryRequestRoutes = require("./routes/entryRequestRoutes");
const entryLogRoutes = require("./routes/entryLogRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const {
    securityHeaders,
    generalLimiter,
    authLimiter,
} = require("./middleware/securityMiddleware");

const app = express();

const PORT = process.env.PORT || 5000;


/* =========================================================
   TRUST PROXY
   Required for Render + express-rate-limit
========================================================= */

app.set("trust proxy", 1);


/* =========================================================
   CORS CONFIGURATION
========================================================= */

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://gate-manager-sigma.vercel.app",
];


// Allow frontend URL from Render Environment Variables
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(
        process.env.FRONTEND_URL
    );
}


app.use(
    cors({
        origin: (origin, callback) => {

            // Allow requests without Origin
            // Example: Postman, Swagger and server-to-server requests
            if (!origin) {
                return callback(null, true);
            }


            // Allow known frontend origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }


            // Block unknown origins
            console.log(
                "CORS blocked origin:",
                origin
            );

            return callback(
                new Error(
                    `CORS blocked origin: ${origin}`
                )
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        optionsSuccessStatus: 204,
    })
);


/* =========================================================
   SECURITY MIDDLEWARE
========================================================= */

app.use(
    securityHeaders
);


/* =========================================================
   RATE LIMITING
========================================================= */

// General API rate limiter
app.use(
    "/api",
    generalLimiter
);


// Login rate limiter
app.use(
    "/api/auth/login",
    authLimiter
);


/* =========================================================
   LOGGING
========================================================= */

app.use(
    morgan("dev", {
        stream: {
            write: (message) => {
                logger.info(
                    message.trim()
                );
            },
        },
    })
);


/* =========================================================
   BODY PARSING
========================================================= */

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true,
    })
);


/* =========================================================
   ROOT ROUTE
========================================================= */

app.get(
    "/",
    (req, res) => {

        const baseUrl =
            process.env.RENDER_EXTERNAL_URL ||
            `http://localhost:${PORT}`;

        res.json({
            message:
                "Gate Manager API is running",

            docs:
                `${baseUrl}/api-docs`,
        });
    }
);


/* =========================================================
   API ROOT
========================================================= */

app.get(
    "/api",
    (req, res) => {

        res.json({
            message:
                "Gate Manager API Working",
        });
    }
);


/* =========================================================
   SWAGGER
========================================================= */

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(
        swaggerDocument
    )
);


app.get(
    "/api-docs.json",
    (req, res) => {

        res.json(
            swaggerDocument
        );
    }
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/employees",
    employeeRoutes
);


app.use(
    "/api/vehicles",
    vehicleRoutes
);


app.use(
    "/api/entry-requests",
    entryRequestRoutes
);


app.use(
    "/api/entry-logs",
    entryLogRoutes
);


app.use(
    "/api/dashboard",
    dashboardRoutes
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({
            error:
                "Route not found",
        });
    }
);


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
    (err, req, res, next) => {

        logger.error(
            `Global error: ${err.message}`
        );


        // CORS error
        if (
            err.message &&
            err.message.startsWith(
                "CORS blocked origin"
            )
        ) {

            return res.status(403).json({
                error:
                    "Origin is not allowed",
            });
        }


        // General server error
        res.status(
            err.status || 500
        ).json({

            error:
                err.message ||
                "Internal server error",

        });
    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `Server is running on port ${PORT}`
        );

        console.log(
            `Swagger docs available on port ${PORT}`
        );

        console.log(
            "Allowed CORS origins:"
        );

        allowedOrigins.forEach(
            (origin) => {
                console.log(
                    `- ${origin}`
                );
            }
        );
    }
);