/* eslint-env browser */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

window.addEventListener("load", () => {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(
    "ws://localhost:1234",
    "only-room-id",
    ydoc
  );
  provider.on("status", (event) => {
    console.log("status event", event);
  });
  provider.on("sync", (event) => {
    console.log("sync event", event);
  });
  const ymap = ydoc.getMap("transcripts");
  const transcriptsContainer = document.getElementById("transcripts");

  ymap.observeDeep((ymapEvent) => {
    ymapEvent.target === ymap; // => true

    // Find out what changed:
    // Option 1: A set of keys that changed
    // ymapEvent.keysChanged; // => Set<strings>
    // // Option 2: Compute the differences
    // ymapEvent.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>

    // sample code.
    //   ymapEvent.changes.keys.forEach((change, key) => {
    //     if (change.action === "add") {
    //       console.log(
    //         `Property "${key}" was added. Initial value: "${ymap.get(key)}".`
    //       );
    //     } else if (change.action === "update") {
    //       console.log(
    //         `Property "${key}" was updated. New value: "${ymap.get(
    //           key
    //         )}". Previous value: "${change.oldValue}".`
    //       );
    //     } else if (change.action === "delete") {
    //       console.log(
    //         `Property "${key}" was deleted. New value: undefined. Previous value: "${change.oldValue}".`
    //       );
    //     } else {
    //       console.error("Unexpected change action. ", change.action);
    //     }
    updateTranscripts(ymap, transcriptsContainer);
  });
  // });

  /// creates one <p> element for each transcript, and fills it with the transcript text.
  /// then, adds the <p> elements to the container in order of their keys.
  function updateTranscripts(ymap, container) {
    const transcriptElements = [];
    ymap.forEach((transcript, key) => {
      const transcriptElement = document.createElement("p");
      transcriptElement.textContent = transcript.get("transcript");
      transcriptElements.push({ key, transcriptElement });
    });
    // sort the transcripts by their numeric keys.
    // sort in reverse order to get the last transcript at the top.
    transcriptElements.sort((a, b) => b.key - a.key);
    container.innerHTML = "";
    transcriptElements.forEach(({ transcriptElement }) => {
      container.appendChild(transcriptElement);
    });
  }

  // const editor = new Quill(editorContainer, {
  //   modules: {
  //     cursors: true,
  //     toolbar: [
  //       [{ header: [1, 2, false] }],
  //       ['bold', 'italic', 'underline'],
  //       ['image', 'code-block']
  //     ],
  //     history: {
  //       userOnly: true
  //     }
  //   },
  //   placeholder: 'Start collaborating...',
  //   theme: 'snow' // or 'bubble'
  // })

  // const binding = new QuillBinding(ytext, editor, provider.awareness)

  /*
  // Define user name and user name
  // Check the quill-cursors package on how to change the way cursors are rendered
  provider.awareness.setLocalStateField('user', {
    name: 'Typing Jimmy',
    color: 'blue'
  })
  */

  const connectBtn = document.getElementById("y-connect-btn");
  connectBtn.addEventListener("click", () => {
    if (provider.shouldConnect) {
      provider.disconnect();
      connectBtn.textContent = "Connect";
    } else {
      provider.connect();
      connectBtn.textContent = "Disconnect";
    }
  });

  // @ts-ignore
  // window.example = { provider, ydoc, ytext, Y }
});
