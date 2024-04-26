# Maps Integration for Delta Chat clients

> An "Integration" is a [`.xdc` file](https://webxdc.org)
> that speaks to the deltachat-core-library instead of to other .xdc instances.
> From the view of the messenger implementor, the integrations behave like normal `.xdc` files

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

to create a `.xdc` file that can be attached to a Delta Chat group, execute:

```sh
./create-xdc.sh
```
