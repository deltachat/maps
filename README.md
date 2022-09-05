# leaflet on webxdc

this little demonstration shows a map using [leaflet](https://leafletjs.com) in a [webxdc](https://webxdc.org) mini app.

the map needs `internet_access` to be enabled, which currently requires the app to be used in "Saved Messages"
of a self-compiled Delta Chat (the feature is not yet released anywhere).

<img width=320 src=https://user-images.githubusercontent.com/9800740/188469762-34229663-09c9-4c5f-b6b5-c97c23ee78ac.png>

[Download .xdc from Release Assets](https://github.com/r10s/maps/releases), attach to a self-build Delta Chat "Saved Messages" and travel the world!

## Building

to create a `.xdc` file that can be attached to a Delta Chat group, execute:

```sh
./create-xdc.sh
```
