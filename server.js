const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Point = require('./models/Point');
const Action = require('./models/Action');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/place';

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

async function savePoint(params) {
    const { x, y, w, h, c, user } = params;
    try {
        let data = await Point.findOne({ x, y });
        if (data) {
            data.w = w;
            data.h = h;
            data.c = c;
            data.user = user;
            data.update_at = new Date();
            await data.save();
        } else {
            await Point.create({
                x, y, w, h, c,
                user: user,
                create_at: new Date(),
                update_at: new Date()
            });
        }
    } catch (e) {
        console.error('Error saving point:', e);
    }
}

async function createAction(params) {
    const { point, user } = params;
    try {
        await Action.create({
            point: point,
            user: user,
            create_at: new Date()
        });
    } catch (e) {
        console.error('Error creating action:', e);
    }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('draw', async (params, cb) => {
        // console.log('draw', params);
        const { user, data } = params;
        
        // Basic auth check
        if (!user || (!user.name && !user.username)) {
            if (cb) cb(false);
            return;
        }

        // Broadcast to others
        socket.broadcast.emit('draw', data);
        
        if (cb) cb(true);

        // Save to DB
        // Assuming user object has username, or just use a default if not present
        const username = user.displayName || user.name || user.username || 'anonymous';
        
        createAction({
            point: data,
            user: username
        });

        savePoint({
            ...data,
            user: username
        });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
