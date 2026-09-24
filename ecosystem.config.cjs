// PM2 config for running on a VPS: `pm2 start ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: 'tgcarvibes',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3005',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
  ],
};
