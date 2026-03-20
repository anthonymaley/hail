<<:context: migrating a Node.js API from Express to Fastify
<<:format: code only

Convert this route:

app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})
