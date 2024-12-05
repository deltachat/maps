# Maps Integration for Delta Chat clients

> An "Integration" is a [webxdc file](https://webxdc.org)
> that speaks to the deltachat-core-library instead of other webxdc instances.
> From the view of the messenger implementor, the integrations behave like a normal webxdc.

To use this integration in a client,
get a [core](https://github.com/deltachat/deltachat-core-rust/) with 1.137.4 or newer,
build `maps.xdc` as described below,
add it to the client using
[`dc_set_webxdc_integration()`/`dc_init_webxdc_integration()`](https://c.delta.chat/classdc__context__t.html#a60fd03f7cae5046ed2b33c095f41eec2)
and open it as a usual webxdc.

The map is shown using [Leaflet](https://leafletjs.com) and looks like the following:

![Maps Screenshot](images/screenshot.jpg)

The protocol used to speak to core is described atop of
[`maps_integration.rs`](https://github.com/deltachat/deltachat-core-rust/blob/main/src/webxdc/maps_integration.rs).

Compared to eg. Mapbox on Android, this solution is
[8mb smaller and has 2000+ lines less boilerplate code](https://github.com/deltachat/deltachat-android/pull/3005#pullrequestreview-2022776484).

In general, however, the integration could use other maps as well,
it is not bound to Leaflet.

[Online Demo](https://deltachat.github.io/maps/)

## Building

to create `maps.xdc` file, execute:

```sh
./create-xdc.sh
```

Note, that `maps.xdc` is meant to be used as an integration as described below
and will work only limited when send to a chat.


## Replace Integrations

Webxdc developers can replace the shipped `maps.xdc` with a tweaked version -
either use different map sources, different engines
or add completely new features for tracking, hiking, whatever.

For that purpose:

- In `manifest.toml`, add the entry `request_integration = map`
  (this is already true if you use this repository as a template)

- Attach the `.xdc` to the "Saved Messages" chat of Delta Chat 1.50.0 or newer.
  If things work out,
  the summary will read "🌍 Used as map. Delete to use default"

When now tapping the map symbol _inside any chat_,
the map replacement is started instead of the shipped one.

Note, that this has to be done locally.
In a multi-device-setup, you have to perform this action for every device.

The replacing is experimental and not meant for end users yet but for Webxdc developers.
