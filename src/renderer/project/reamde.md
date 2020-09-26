# About ids

All Features have an id that is composed using the layer ID and a unique feature ID:

```feature:${layerId}/${id}```

## Expected behaviour for UNDO and REDO

Let's assume the following steps executed by a user:

1) Select a symbol from the palette and add it to a layer. This acion creates a "feature"
2) Move the feature on the map to location "A".
3) Move it again to location "B".
4) Delete the feature from the map.
5) Execute UNDO: the feature will get undeleted (re-added to the layrt) and its location on the map will be "B".
6) Execute UNDO: the feature will move to location "A"
7) Execute UNDO: the feature will be removed from the layer

## Expected behaviour for COPY/PASTE

Whe a user executes COPY/PASTE we will create NEW features for every PASTE action. Every new feature will have a NEW unique ID.

## Expected behaviour for CUT/PASTE

When a user executes CUT/PASTE we will insert THE SAME feature. Thus, the featureID stays the same as long as the feature is pasted on THE SAME layer.

If CUT/PASTE is employed to MOVE a feature from one layer to some other layer the featureId will get changed accordingly.

