// PM2 — jalankan permanen di VPS: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "ruangai",
      script: "server/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
