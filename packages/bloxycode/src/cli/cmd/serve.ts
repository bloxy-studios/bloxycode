import { Server } from "../../server/server"
import { cmd } from "./cmd"
import { withNetworkOptions, resolveNetworkOptions } from "../network"
import { Flag } from "../../flag/flag"

export const ServeCommand = cmd({
  command: "serve",
  builder: (yargs) => withNetworkOptions(yargs),
  describe: "starts a headless bloxycode server",
  handler: async (args) => {
    if (!Flag.BLOXYCODE_SERVER_PASSWORD) {
      console.log("Warning: BLOXYCODE_SERVER_PASSWORD is not set; server is unsecured.")
    }
    const opts = await resolveNetworkOptions(args)
    const server = Server.listen(opts)
    console.log(`bloxycode server listening on http://${server.hostname}:${server.port}`)
    await new Promise(() => {})
    await server.stop()
  },
})
