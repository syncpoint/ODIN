### Issues

### Release April 2019 - Map
* Map (Leaflet) with Raster Tiles
* Pan/Zoom (keyboard/mouse)
* EPSG 3857 (Web Mercator)
* Tile Provider configuration file (tile-providers.json)
* Tile Provider -> application menu (with shortcuts)
* Map scale/ruler (exact, e.g. 1 : 48721 instead of 1 : 50000)
* directly choose scale (zoom factor), e.g. 1 : 50000, 1 : 25000
* location search (online only, https://wiki.openstreetmap.org/wiki/Nominatim)
* - right (temporary) side bar
* - spotlight-like: text input, result list, map preview (pan/zoom enabled)
* user settings: coordinate display format (latitude/longitude, decimal degrees, UTM, UTMREF, MRGS)
* goto coordinate (multiple formats, marker temporarily marks position)
* pick coordinate (copy to clipboard as text in configured display format)
* named bookmarks (center, zoom): create, goto, delete (overwrite existing)
* additional user settings:
* - map zoom/center (last position)
* - brightness (and other display filters)
* - current tile provider
* - bookmarks
* - location search history

### On-deck
* APP-6 (C), MIL-STD-2525 (C)
* Cut, Copy Paste, Delete
* update symbol/graphics properties (temporary side bar)
* graphics editor (line, linestring, polygon, fanarea)
* Symbol Palette (left permanent side bar) with text search
* different symbol sets in palette (e.g. Ground Units, Tasks, Events, Graphics)
* dynamic 'recently used' symbol set
* move position in map

### Backlog for unplanned features
* PDF/PNG map export
* Text message chat (possibly with map/layer or other attachments)
* ORBAT/OOB (Order of Battle) management
* project/mission support
* creation/editing of maps and layers with support for tactical symbology
* multi-window support
* vector tile support (Mapbox)
* UTM support (raster and/or vector tiles)
* [MIP](https://public.mip-interop.org/Pages/Default.aspx)/[DEM](https://public.mip-interop.org/Public%20Document%20Library/04-Baseline_3.1/Interface-Specification/MTIDP/MTIDP-3.1.2-AnnexB-MIP_DEM_Specification.pdf) interface (Baseline 3)
* report entry (location, status for own/enemy units)
* event based distribution/broadcasting of tracking/reported information (own/enemy units/equipments)
* Kommandotagebuch (KTB) (initial support)
* Sichbarkeitsbereiche, Line of Sight, Höhendaten

### Libraries
* https://turfjs.org