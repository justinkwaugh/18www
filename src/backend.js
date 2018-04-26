import Koa from 'koa';
import logger from 'koa-logger';
import Router from 'koa-router';
import koaBody from 'koa-body';
import serve from 'koa-static';
import Api from 'common/api/api';

const env = process.env.NODE_ENV || 'development';

const app = module.exports = new Koa();
app.use(logger());
app.use(koaBody());
app.use(serve(__dirname));

const router = new Router();
router.get('/api/login', Api.login);
router.get('/api/logout', Api.logout);
router.get('/api/register', Api.registerUser);
router.get('/api/games', Api.listGames);
router.get('/api/game/create', Api.createGame);
router.get('/api/game/state', Api.getGameState);

app.use(router.routes());
app.listen('3000');
