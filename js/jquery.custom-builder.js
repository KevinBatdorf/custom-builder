/*!*********************************************************************
*
*  Custom Builder
*  Kevin Batdorf
*
*  http://kevinbatdorf.com
*
*  MIT or GPL license
*
************************************************************************/
/*global $, jQuery */
/*jshint unused:false */

if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    "use strict";
    function F() {}
    F.prototype = obj;
    return new F();
  };
}

(function ($, window, document, undefined) {
  "use strict";

  var CustomBuilder = {

    setup: function(options, elem) {
      var self = this;
      // Set the options
      self.options = $.extend({}, $.fn.customBuilder.options, options);

      self.elem = elem;
      self.modules = [];

      // First we have to get authentication if needed
      self.deferredAuth = $.Deferred();
        if (self.options.authenticate) {
          self.getAuthInfo();
        } else {
          // If we won't use authentication, continue
          self.deferredAuth.resolve();
        }
      // After we fetch the login info, continue on
      self.deferredAuth.then(
      function() {
        // Let's fetch the header file early if needed
        if (self.options.headerFile) {
          self.fetchFile(self.options.userName, self.options.repoName, self.options.headerFile, function(content) {
            self.modules[0] = content;
          });
        }
        // Setup the button
        self.buttonEvent();
      },
      function() {
        //console.log('error: check your login info');
      });
    },

    getAuthInfo: function() {
      var self = this;
      $.post((self.options.loginInfoFile + "?ajax"), function(data){
        self.authInfo = $.parseJSON(data);
        self.buildAuthString();
        self.deferredAuth.resolve();
      });
    },

    buildAuthString: function() {
      var self = this;
      self.authString = "?client_id=" + self.authInfo.client_id +
        "&client_secret=" + self.authInfo.client_secret;
    },

    buttonEvent: function() {
      var self = this;
      // Let's do something when the download button is clicked
      $('.compile').on('click', function() {
        // Cache the relevant items
        self.checkedCached = $('.options input:checked').toArray();
        self.numOfCheckboxes = self.checkedCached.length;
        // Abort if nothing was checked
        if (self.numOfCheckboxes === 0) { return false; }
        // Update the progressbar to account for the header
        self.updateProgressBar(1 / (self.numOfCheckboxes + 1)  * 100);
      $(this)
          // Update the text so the user knows what's going on
          .html(self.options.buttonProcessingText)
          // Disable the processing event
          .off();
        self.increment = 0;
        self.processFiles();
      });
    },

    processFiles: function() {
      var self = this;
      // Defer so we can move one by one.
      self.checkedDeferred = $.Deferred();
      // Fetch the data from Github
      self.fetchFile(self.options.userName, self.options.repoName, $(self.checkedCached[self.increment]).attr('id'), function(content) {
        self.modules[self.increment + 1] = content;
        // Stop when the array is full (+1 to account for the header)
        if (self.modules.length === self.numOfCheckboxes + 1) {
          self.finalizeFile();
        } else {
          self.checkedDeferred.resolve();
          self.increment = self.increment + 1;
          self.updateProgressBar();
          // Repeat the process for each file.
          self.processFiles();
        }
      });
    },

    updateProgressBar: function(percent) {
      var self = this,
          percentage = percent || ( (self.increment + 1) / (self.numOfCheckboxes + 1) ) * 100,
          progressBarWidth = ( (percentage * $('.progress-bar-outer').width()) / 100 );
      $('.progress-bar').animate({ width:progressBarWidth },200);
    },

    fetchFile: function(user, repo, filePath, callback) {
      var self = this;

      //if (self.options.useLocalFiles) {
        // Add option to allow local files.
     // } else { // Get files from Github

        // If we need the sha, go get it.
        self.deferredSha = $.Deferred();
        if (!self.options.sha) {
          self.getSha(user, repo, filePath);
        } else {
          self.sha = filePath;
          self.deferredSha.resolve();
        }
        // After we have the sha, let's get the file
        self.deferredSha.then(
          function() {
            $.ajax({
              type: "GET",
              url: "https://api.github.com/repos/" + user + "/" + repo + "/git/blobs/" + self.sha + self.authString,
              dataType: "jsonp",
              success: function(data) {
                self.decodeData(data, callback);
              }
            });
          },
          function() {
            //console.log('error: unable to retrieve the file.');
          }
        );
      //}
    },

    getSha: function(user, repo, filePath) {
      var self = this;
      $.ajax({
        type: "GET",
        url: "https://api.github.com/repos/" + user + "/" + repo + "/contents/" + filePath + self.authString,
        dataType: "jsonp",
        success: function(data){
          self.sha = data.data.sha;
          self.deferredSha.resolve();
          // Include a return in case accessed externally
          return data.data.sha;
        }
      });
    },

    decodeData: function(data, callback) {
      if (data.data.content && data.data.encoding === "base64") {
        var contentArray =
          window
            .atob(data.data.content.replace(/\n/g, ""))
            .split("\n");
        callback(contentArray.join("\n"));
      }
    },

    finalizeFile: function() {
      var self = this;
      // Get the footer file
      if (self.options.footerFile) {
        self.fetchFile(self.options.userName, self.options.repoName, self.options.footerFile, function(content) {
          (self.modules).push(content);
          self.adjustSettings();
        });
      } else { self.adjustSettings(); }

    },

    adjustSettings: function() {
      var self    = this,
          output  = (self.modules).join(""),
          checked = $('.options input:checked');

      if (self.options.adjustSettings) {
        checked.each(function(n) {
          var data = $(this).data('cbuilder');
          $.each(data, function(key, value) {
            output = output.replace(key, value);
          });
        });
        setOutput(output);
      } else {
        setOutput(output);
      }

      function setOutput(output) {
        // Make final updates on progress bar
        self.finalizeProgress();
        // Set the value to the output
        $('.cb-output').val( output );
      }
    },

    finalizeProgress: function() {
      var self = this;
      self.updateProgressBar(100);
      if (self.options.progressBarText !== null) {
        $('.progress-bar').html(self.options.progressBarText);
      }
        self.finalizeButton();
    },

    finalizeButton: function() {
      var self = this;
      $('.compile')
        // Change button text
        .html(self.options.buttonFinishedText)
        // Turn the button into a form to process via php
        .wrap('<form class="cb-form" action="' + self.options.actionFile + '" method="post"></form>')
        // Add a hidden element
        .after('<input type="hidden" name="cb-output" class="cb-output">');
    }
  };

  $.fn.customBuilder = function (options) {
    return this.each(function () {

      var builder = Object.create(CustomBuilder);
      builder.setup(options, this);

      $.data(this, 'customBuilder', builder);
    });
  };

  $.fn.customBuilder.options = {
    userName:             "username",
    repoName:             "repository",
    sha:                  false,
    headerFile:           null,
    footerFile:           null,
    buttonProcessingText: "Building...",
    buttonFinishedText:   "Download Now",
    progressBarText:      null,
    actionFile:           "build.php",
    authenticate:         false,
    loginInfoFile:        "build.php",
    adjustSettings:       true
  };

})(jQuery, window, document);