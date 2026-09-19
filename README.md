# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

**Requirements:** Node 20+, and [Expo Go](https://expo.dev/go) installed on your phone.

```bash
npm install
```

Then pick the command that matches the network you are on.

### On a normal network (home Wi-Fi, phone hotspot)

```bash
npm start
```

Scan the QR code with your iPhone Camera app. Your phone and laptop must be on
the same network.

### On Plaksha campus Wi-Fi

Campus Wi-Fi runs a FortiGate firewall that blocks ngrok, so Expo's built-in
`--tunnel` can never connect. It may also stop your phone from reaching your
laptop directly, which breaks `npm start`. Use a Cloudflare tunnel instead:

```bash
npm run tunnel
```

This prints a `https://<random-words>.trycloudflare.com` URL. Open Expo Go,
tap **Enter URL manually**, and paste it. Your phone can be on any network,
including cellular.

The URL changes every restart, so paste it again each session.

**One-time setup:** install `cloudflared` and make sure it is on your PATH.

| OS | Command |
| --- | --- |
| Windows | `winget install --id Cloudflare.cloudflared` |
| macOS | `brew install cloudflared` |
| Linux | [download a release](https://github.com/cloudflare/cloudflared/releases/latest) |

Verify with `cloudflared --version`.

### Stable URL (maintainer only)

```bash
npm run tunnel:named
```

Serves on `https://dev.deserver.in`, which never changes. This needs Cloudflare
credentials in `~/.cloudflared/` that are not in this repo, so it only works on
a machine that has been set up for it. Everyone else uses `npm run tunnel`.

### Useful flags

```bash
npm run tunnel -- --clear      # clear the Metro cache
EXPO_PORT=8082 npm run tunnel  # use a different port
```

Screens live in **src/app** and use [file-based routing](https://docs.expo.dev/router/introduction)
— a new file in that directory becomes a new route.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
