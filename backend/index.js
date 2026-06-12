const express = require('express');
const app = express();
app.use(express.json());
require('./cron/insights');

app.use('/auth', require('./routes/auth'));
app.use('/habits', require('./routes/habits'));
app.use('/habits', require('./routes/logs'));
app.use('/stats', require('./routes/stats'));
app.use('/insights', require('./routes/insights'));

app.listen(3000, () => console.log('Server running on port 3000'));
