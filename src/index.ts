import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import { Post } from './entities/Post'
import microConfig from './mikro-orm.config'

const main = async () => {
  //connect to db
  const orm = await MikroORM.init(microConfig)
  //run migrations
  await orm.getMigrator().up()
  //run sql
  const post = orm.em.create(Post, { title: 'my first post' })
  await orm.em.persistAndFlush(post)
}

main().catch((err) => {
  console.log(err)
})
