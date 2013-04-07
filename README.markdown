[Custom Builder](http://kevinbatdorf.com/custom-builder)
============
A custom module builder for any programming language, using GitHub

[Download](https://github.com/KevinBatdorf/custom-builder/zipball/master)


What Does It Do?
----------------

Basically it concates files together from Github, allowing users to select which modules they want to include


Why Would I Use It?
-------------------

It just gives you one less thing to worry about. Using Github, you can keep your files up to date, rather than worrying about continuously updating them on your server. If your code is not updated often, this plugin probably isnt for you.


Limitations
-----------

You need to [set up a GitHub application](https://github.com/settings/applications/new) in order to increase the API rate limit from 60 requests to 5000 requests per hour.

If you have 5 files, the script will make 10 requests. This is because the code first uses the name of the file to retrieve the most recent version number, then uses that version number to grab that file.

I'm not sure how secure the JSON request for the PHP token is, thoughts? 

How to Use
-----------

First, you should only use this if your code can be broken into modules. See [an example of my code](https://github.com/KevinBatdorf/liquidslider/tree/master/modules). I'm using JavaScript (jQuery), but theoretically you can use whatever language you want. 

Next, you change the files for each module name in your markup:

```html
<div class="cb-options">
  <!-- The Checkboxes -->
    <input type='checkbox' value='path/to/module1' id='module1'>
      <label for='module1'>module1</label>
    <!-- The Button -->
    <button class="compile">Compile</button>
    <div class="progress-bar-outer">
        <div class="progress-bar" style="width: 0%"></div>
    </div>
  </div>
```

Notice that you may include a progress bar as well.

Then, edit the following JavaScript settings:

```javascript
    userName:               "username",       // GitHub user name
    repoName:               "repository",     // GitHub repo name
    sha:                    false,            // Use SHA instead of file name
    headerFile:             null,             
    footerFile:             null,             
    buttonProcessingText:   "Building...",
    buttonFinishedText:     "Download Now",
    progressBarText:        null,             // Optionally add text on complete
    actionFile:             "build.php",
    authenticate:           false,            // Enable to increase API rate limit
    loginInfoFile:          "build.php"
```

Some important things to pay attention to. You have to include a header and footer file, two files which would be included in each file regardless. 

Finally, depending on your plugin options, you might have to write some additional javascript to set certain values from true to false so that your plugin will work. An automated method might be included in future updates.