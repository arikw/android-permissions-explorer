## Instructions to Extract Permission Information

To extract permission information from the Android documentation, open the DevTools console on the [`https://developer.android.com/reference/android/Manifest.permission`](https://developer.android.com/reference/android/Manifest.permission) page and paste the following javascript code:

```javascript
function extractPermissionInfo(element) {
  // Use the data-version-added attribute for the API level if available.
  const apiLevel = element.getAttribute("data-version-added") || "";

  // Get the permission name from the h3 element.
  const h3 = element.querySelector("h3.api-name");
  const permissionId = h3
    ? (h3.getAttribute("data-text") || h3.id || h3.textContent.trim().replace(/\s+/g, ""))
    : "";

  // Prepare variables for full permission name, protection level, and description.
  let protectionLevel = [];
  let fullPermissionId = "";
  const descriptionParts = [];

  // Loop over all <p> elements inside the element.
  const pElements = element.querySelectorAll("p");
  pElements.forEach((p) => {
    const text = p.textContent.trim();
    if (text.startsWith("Protection level:")) {
      // Extract the protection level value (e.g. "dangerous").
      protectionLevel = text.split("Protection level:")[1].trim()?.split('|');
    } else if (text.startsWith("Constant Value:")) {
      // Extract the full permission name inside the quotes.
      const match = text.match(/"([^"]+)"/);
      if (match) {
        fullPermissionId = match[1];
      }
    } else if (text) {
      // Assume all other paragraphs form part of the description.
      descriptionParts.push(text);
    }
  });
  
  // Combine description parts into a single string.
  const description = descriptionParts.join(" ");

  // Return a JSON object with the extracted data.
  return {
    apiLevel,
    permissionId,
    fullPermissionId,
    description,
    protectionLevel
  };
}

const permissionsData = Array.from(document.querySelectorAll('#jd-content > div[data-version-added]')).filter(el => el.innerText.includes('Protection level:')).map(extractPermissionInfo);

copy(permissionsData);
```

After running the script, the extracted data will be copied to your clipboard.

Paste the copied data into the `website/permissions.json` file.