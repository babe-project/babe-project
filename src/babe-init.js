function _babeInit(config) {
    const _babe = {};

    // views handler
    _babe.views_seq = _.flatten(config.views_seq);
    _babe.currentViewCounter = 0;
    _babe.currentTrialCounter = 0;
    _babe.currentTrialInViewCounter = 0;

    // progress bar information
    _babe.progress_bar = config.progress_bar;

    // results collection
    // --
    // general data
    _babe.global_data = {
        startDate: Date(),
        startTime: Date.now()
    };
    // data from trial views
    _babe.trial_data = [];

    // more deploy information added
    _babe.deploy = config.deploy;
    _babe.deploy.MTurk_server = _babe.deploy.deployMethod == "MTurkSandbox" ?
    "https://workersandbox.mturk.com/mturk/externalSubmit" : // URL for MTurk sandbox
    _babe.deploy.deployMethod == 'MTurk' ?
    "https://www.mturk.com/mturk/externalSubmit" : // URL for live HITs on MTurk
    ""; // blank if deployment is not via MTurk
    // if the config_deploy.deployMethod is not debug, then liveExperiment is true
    _babe.deploy.liveExperiment = _babe.deploy.deployMethod !== "debug";
    _babe.deploy.is_MTurk = _babe.deploy.MTurk_server !== "";
    _babe.deploy.submissionURL = _babe.deploy.deployMethod == "localServer" ? "http://localhost:4000/api/submit_experiment/" + _babe.deploy.experimentID : _babe.deploy.serverAppURL + _babe.deploy.experimentID;

    // adds progress bars to the views
    _babe.progress = _babeProgress(_babe);
    _babe.submission = _babeSubmit(_babe);

    // handles the views rendering
    _babe.findNextView = function() {
        let currentView = _babe.views_seq[_babe.currentViewCounter];

        if (_babe.currentTrialInViewCounter < currentView.trials) {
            currentView.render(currentView.CT, _babe);
        } else {
            _babe.currentViewCounter++;
            currentView = _babe.views_seq[_babe.currentViewCounter];
            _babe.currentTrialInViewCounter = 0;
            if (currentView !== undefined) {
                currentView.render(currentView.CT, _babe);
            } else {
                $("#main").html(
                    Mustache.render(
                    `<div class='view'>
                        <h1 class="title">Nothing more to show</h1>
                    </div>`));
                return;
            }
        }
        // increment counter for how many trials we have seen of THIS view during THIS occurrence of it
        _babe.currentTrialInViewCounter++;
        // increment counter for how many trials we have seen in the whole experiment
        _babe.currentTrialCounter++;
        // increment counter for how many trials we have seen of THIS view during the whole experiment
        currentView.CT++;

        // updates the progress bar if the view has one
        if (currentView.hasProgressBar) {
            _babe.progress.update();
        }
    };

    // checks the deployMethod
    (function() {
        if (_babe.deploy.deployMethod === 'MTurk' || _babe.deploy.deployMethod === 'MTurkSandbox') {
                console.info(
`The experiment runs on MTurk (or MTurk's sandbox)
----------------------------

The ID of your experiment is ${_babe.deploy.experimentID}

The results will be submitted ${_babe.deploy.submissionURL}

and

MTurk's server: ${_babe.deploy.MTurk_server}`
        );
            } else if (_babe.deploy.deployMethod === 'Prolific') {
                console.info(
`The experiment runs on Prolific
-------------------------------

The ID of your experiment is ${_babe.deploy.experimentID}

The results will be submitted to ${_babe.deploy.submissionURL}

with

Prolific URL (must be the same as in the website): ${_babe.deploy.prolificURL}`
        );
            } else if (_babe.deploy.deployMethod === 'directLink') {
                console.info(
`The experiment uses Direct Link
-------------------------------

The ID of your experiment is ${_babe.deploy.experimentID}

The results will be submitted to ${_babe.deploy.submissionURL}`
        );
            } else if (_babe.deploy.deployMethod === 'debug') {
                console.info(
`The experiment is in Debug Mode
-------------------------------

The results will be displayed in a table at the end of the experiment and available to download in CSV format.`
        );
            } else {

                throw new Error(
`There is no such deployMethod.

Please use 'debug', 'directLink', 'Mturk', 'MTurkSandbox' or 'Prolific'.

The deploy method you provided is '${_babe.deploy.deployMethod}'.

You can find more information at https://github.com/babe-project/babe-base`
        );
            }

            if (_babe.deploy.deployMethod === 'Prolific' && (_babe.deploy.prolificURL === undefined || _babe.deploy.prolificURL === '')) {
                throw new Error (errors.prolificURL);
            }

            if (_babe.deploy.contact_email === undefined || _babe.deploy.contact_email === '') {
                throw new Error (errors.contactEmail);
            }
    })();

    // adds progress bars
    _babe.progress.add();

    // renders the first view
    _babe.findNextView();
};