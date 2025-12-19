import { app } from "./app.js";
import { env } from "./config/env.js";
import logger from "./lib/logger.js";

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`API running on port ${PORT}`);
});
