const home_href = '';
const upload_href = "upload.php";
const ext2format = {
    "docx": "docx",
    "epub": "epub",
    "htm": "html",
    "html": "html",
    "markdown": "markdown",
    "md": "markdown",
    "tei": "tei",
    "txt": "markdown",
    "xhtml": "html",
    "xml": "tei"
};
const formats = {
    "docx": {
        "ext":".docx",
        "mime":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
    "epub": {
        "ext":".epub",
        "mime":"application/epub+zip"
    },
    "html": {
        "ext":".html",
        "mime":"text/html; charset=utf-8"
    },
    "markdown": {
        "ext":".md",
        "mime":"text/plain; charset=utf-8"
    },
    "md": {
        "ext":".md",
        "mime":"text/plain; charset=utf-8"
    },
    "tei": {
        "ext":".xml",
        "mime":"text/xml"
    }
};
const exports = ["tei", "docx", "html", "md"];

/**
 * A simple String.format() Python like with defaul value.
 * "Hi {}, are you {} or {idiot}?".format('guy', 'happy') == "Hi guy, are you happy or idiot?";
 * "{0}! {0}!  {Hein}?".format("Ho") == "Ho! Ho! Hein?"
 */
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        const parts = this.split(/{[^}]*}/);
        const length = parts.length;
        let i = -1;
        return this.replace(/{([^}]*)}/g, function (match, key) {
            i++;
            // numbered argument {2}
            const n = parseInt(key, 10);
            if (!isNaN(n) && args[n] !== undefined) return args[n];
            // empty or defaut argument {} {key}, use natural order
            if (args[i] !== undefined) return args[i];
            // if key not empty, retur it
            if (key) return key;
            // {}, let placeholder
            return match;
        });
    };
}

function dropInit() {
    const dropZone = document.querySelector("#dropzone");
    const dropOutput = dropZone.querySelector("output");
    const dropBut = dropZone.querySelector("button");
    const dropInput = dropZone.querySelector("input");
    const dropPreview = document.getElementById('preview');
    const dropDownload = document.getElementById('download');
    const dropExports = document.getElementById('exports');
    const dropDownzone = document.getElementById('downzone');

    // shared variable
    let file;
    let format;
    if (dropOutput) {
        dropOutput.innerHTML = document.getElementById("uploadDrag").innerHTML;
    }
    if (dropBut) {
        dropBut.onclick = () => {
            dropInput.click(); //if user click on the button then the input also clicked
        }
    }
    function dropFocus() {
        dropZone.classList.remove("inactive");
        dropZone.classList.add("active");
        dropPreview.classList.remove("active");
        dropPreview.classList.add("inactive");
        dropDownzone.classList.remove("active");
        dropDownzone.classList.add("inactive");
    }
    dropZone.onmousedown = () => {
        dropFocus();
        dropInput.click();
    }
    if (dropInput) {
        dropInput.addEventListener("change", function () {
            //getting user select file and [0] this means if user select multiple files then we'll select only the first one
            file = this.files[0];
            dropFocus();
            showFile(); //calling function
        });
    }
    //If user Drag File Over DropArea
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault(); //preventing from default behaviour
        dropFocus();
        dropOutput.innerHTML = document.getElementById("uploadDrop").innerHTML;
    });
    //If user leave dragged File from DropArea
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("inactive");
        dropZone.classList.remove("active");
        dropOutput.innerHTML = document.getElementById("uploadDrag").innerHTML;
    });
    //If user drop File on DropArea
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault(); //preventing from default behaviour
        //getting user select file and [0] this means if user select multiple files then we'll select only the first one
        file = event.dataTransfer.files[0];
        showFile(); //calling function
    });

    function showFile() {
        // user interrupt ?
        if (!file || !file.name) return;
        dropZone.classList.add("inactive");
        let ext = file.name.split('.').pop();
        format = ext2format[ext];
        if (!format) {
            dropOutput.innerHTML = '<b>“' + format + '” format<br/>is not  supported</b><br/>' + file.name;
            return;
        }
        dropOutput.innerHTML = document.getElementById('uploadFile').innerHTML.format(file.name, format);
        upload();
    }
    async function upload() {
        dropPreview.classList.remove("inactive");
        dropPreview.innerHTML = document.getElementById('waiting').innerHTML.format(file.name);
        let timeStart = Date.now();
        let formData = new FormData();
        formData.append("file", file);
        fetch(upload_href, {
            method: "POST",
            body: formData
        }).then((response) => {
            dropDownzone.classList.add("active");
            dropDownzone.classList.remove("inactive");
            let html = "";
            const name = file.name.replace(/\.[^/.]+$/, "");
            const htmlFrag = document.getElementById("downloadFile").innerHTML;
            for (let i = 0, length = exports.length; i < length; i++) {
                const format2 = exports[i];
                let ext = formats[format2].ext;
                html += htmlFrag.format(format2, name+ext);
            }
            dropExports.innerHTML = html;
            dropPreview.classList.add("active");
            dropPreview.classList.remove("inactive");
            return response.text();
        }).then((html) => {
            dropPreview.innerHTML = html;
            Tree.load();
        });
    }
}
dropInit();

