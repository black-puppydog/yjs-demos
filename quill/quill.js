/* eslint-env browser */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

let provider;

window.addEventListener("load", () => {
  const ydoc = new Y.Doc({ autoLoad: true });
  globalThis.ydoc = ydoc;
  provider = new WebsocketProvider("ws://localhost:1234", "only-room-id", ydoc);
  provider.on("status", (event) => {
    console.log("status event", event);
  });
  provider.on("sync", (event) => {
    console.log("sync event", event);
  });
  const ymap = ydoc.getMap("transcripts");
  const transcriptsContainer = document.getElementById("transcripts");

  ymap.observe((events) => {
    console.log(events);
    events.forEach((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === "add") {
          console.log(
            `Property "${key}" was added. Initial value: `,
            ymap.get(key)
          );
          const transcriptYDoc = ymap.get(`${key}`);
          transcriptYDoc.on("update", (event) => {
            console.log({ key, event });
          });
          const ytext = transcriptYDoc.getText().toString();
          console.log({ ytext });
        } else {
          console.log({ update: event });
        }
      });
    });
  });
  // ymap.observe((ymapEvent) => {
  //   // ymapEvent.target === ymap; // => true

  //   // Find out what changed:
  //   // Option 1: A set of keys that changed
  //   // ymapEvent.keysChanged; // => Set<strings>
  //   // // Option 2: Compute the differences
  //   // ymapEvent.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>

  //   ymapEvent.changes.keys.forEach((change, key) => {
  //     try {
  //       if (change.action === "add") {
  //         console.log(
  //           `Property "${key}" was added. Initial value: "${ymap.get(key)}".`
  //         );

  //         const transcriptYDoc = ymap.get(`${key}`);
  //         // transcriptYDoc.observe((event) => {
  //         //   console.log(`event for ${key}`, event);
  //         // });
  //         transcriptYDoc.autoLoad = true;
  //         console.log(transcriptYDoc);
  //         transcriptYDoc.load();
  //         transcriptYDoc.on("synced", () => {
  //           console.log("synced ", transcriptYDoc);
  //           const richText = transcriptYDoc.getText("richText");
  //           addBlockEditor(transcriptsContainer, key, richText);
  //         });
  //       } else if (change.action === "update") {
  //         console.log(
  //           `Property "${key}" was updated. New value: "${ymap.get(
  //             key
  //           )}". Previous value: "${change.oldValue}".`
  //         );
  //         const richText = ydoc
  //           .getMap("transcripts")
  //           .get(`${key}`)
  //           .get("richText");
  //         if (!richText) {
  //           return;
  //         }
  //         console.log("richText", richText);
  //         addBlockEditor(transcriptsContainer, key, richText);
  //       } else if (change.action === "delete") {
  //         console.log(
  //           `Property "${key}" was deleted. New value: undefined. Previous value: "${change.oldValue}".`
  //         );
  //         removeBlockDocument(transcriptsContainer, key);
  //       } else {
  //         console.error("Unexpected change action. ", change.action);
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //     // updateTranscripts(ymap, transcriptsContainer);
  //   });
  // });
  /// creates one <p> element for each transcript, and fills it with the transcript text.
  /// then, adds the <p> elements to the container in order of their keys.
  function updateTranscripts(ymap, container) {
    const transcriptElements = [];
    ymap.forEach((transcript, key) => {
      const transcriptElement = document.createElement("p");
      const richText = transcript.get("richText");
      transcriptElement.textContent = richText
        ? richText.toString()
        : "undefined";
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

function addBlockEditor(transcriptsContainer, key, richTextDocument) {
  // insert a new <div> with the transcript id at the top of the container
  // TODO: insert it at the correct location according to its id (which is its timestamp)
  const child = document.createElement("div");
  child.setAttribute("id", key);
  transcriptsContainer.prepend(child);

  // bind a new editor to the <div> and the rich text document
  const editor = new Quill(child, {
    modules: {
      cursors: true,
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        ["image", "code-block"],
      ],
      history: {
        userOnly: true,
      },
    },
    placeholder: "Start collaborating...",
    theme: "snow", // or 'bubble'
  });

  const binding = new QuillBinding(richTextDocument, editor);
}
