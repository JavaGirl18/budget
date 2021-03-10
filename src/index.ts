import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
// import { Post } from './entities/Post'
import microConfig from './mikro-orm.config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import redis from 'redis'
import connectRedis from 'connect-redis'
import session from 'express-session'
// import { MyContext } from './types'
// import { MyContext } from './types'

const main = async () => {
  //connect to db
  const orm = await MikroORM.init(microConfig)
  //run migrations
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  redisClient.on('error', function (err) {
    console.log('Error ' + err)
  })
  //cookies
  app.use(
    session({
      name: 'qid',
      store: new RedisStore({
        client: redisClient,
        //change to "ttl" to set expire time on cookie
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years, change later
        httpOnly: true, //may need to change if I want access to cookie in the front end
        sameSite: 'lax', //csrf
        secure: __prod__, // cookie only works in https may need to set to false later
      },
      saveUninitialized: false,
      //create env variable and replace secret
      secret: 'jbjhbjbmjlkjn',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      // importing entities
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  })

  apolloServer.applyMiddleware({ app })

  app.get('/', (_, res) => {
    res.send('hello')
  })
  app.listen(4000, () => {
    console.log('server started on localhost:4000')
  })
}

main().catch((err) => {
  console.log(err)
})
