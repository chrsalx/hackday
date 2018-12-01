require('dotenv').config({silent: true});

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const mongodb = require('mongodb');
const socket = require('socket.io');
const cors = require('@koa/cors');
const http = require('http');

const app = new Koa();
const router = new Router();

let io;

router.get('/', (ctx) => {
  ctx.response.body = `
  <html>
    <body>
      <h1> hey there </h1>
    </body>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js"></script>
    <script>
      var socket = io('http://localhost');
    </script>
  </html>
  `;
});

router.get('/tasks', async (ctx) => {
  ctx.response.body = await ctx
    .dbConnection
    .db('mydb')
    .collection('tasks')
    .find()
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
});

router.post('/tasks', async (ctx) => {
  const { body } = ctx.request;

  const task = {
    title: body.title,
    created_by: body.userName,
    created_at: Date.now(),
  }

  const result = await ctx
    .dbConnection
    .db('mydb')
    .collection('tasks')
    .insertOne(task)
    .then(r => r.ops[0]);

  ctx.response.body = await ctx
    .dbConnection
    .db('mydb')
    .collection('tasks')
    .findOne({ _id: result._id });

  io.emit('task-created', result);

  ctx.response.status = 201;
});

router.patch('/tasks/:taskId', async (ctx) => {
  const { body } = ctx.request;
  const { taskId } = ctx.params;

  const updateQuery = squel
    .update()
    .table('tasks')
    .set('title', body.title)
    .set('updated_at', Date.now())
    .where('id = ?', taskId)
    .toParam()

  await ctx.dbConnection.execute(updateQuery.text, updateQuery.values);

  const findQuery = squel
    .select()
    .from('tasks')
    .where('id = ?', taskId)
    .toParam();

  ctx.response.body = (await ctx.dbConnection.execute(findQuery.text, findQuery.values))[0][0]
  ctx.response.status = 200;
});

router.post('/tasks/:taskId/done', async (ctx) => {
  const { taskId } = ctx.params;

  const updateQuery = squel
    .update()
    .table('tasks')
    .set('done_at', Date.now())
    .set('updated_at', Date.now())
    .where('id = ?', taskId)
    .toParam()

  await ctx.dbConnection.execute(updateQuery.text, updateQuery.values);

  const findQuery = squel
    .select()
    .from('tasks')
    .where('id = ?', taskId)
    .toParam();

  ctx.response.body = (await ctx.dbConnection.execute(findQuery.text, findQuery.values))[0][0]
  ctx.response.status = 200;
});

app
  .use(cors())
  .use(bodyParser())
  .use(async (ctx, next) => {
    const connection = await mongodb.MongoClient.connect(process.env.MONGODB_URL);
    ctx.dbConnection = connection;
    await next();
  })
  .use(router.routes())
  .use(router.allowedMethods());

const server = http.createServer(app.callback())
io = socket(server);

io.on('connection', () => {
    console.log('a user connected')
})

server.listen(80);
