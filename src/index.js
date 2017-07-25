/**
 * This skill helps you solve boredom, modified from template.
 */

var Alexa = require('alexa-sdk');

var states = {
    STARTMODE: '_STARTMODE',                // Prompt the user to start or restart the game.
    ASKMODE: '_ASKMODE',                    // Alexa is asking user the questions.
    DESCRIPTIONMODE: '_DESCRIPTIONMODE'     // Alexa is describing the final choice and prompting to start again or quit
};


// Questions
var nodes = [{ "node": 1, "message": "Are you hungry", "yes": 2, "no": 3 },
             { "node": 2, "message": "Are your friends free", "yes": 4, "no": 5 },
             { "node": 3, "message": "Do your eyes hurt", "yes": 6, "no": 7 },
             { "node": 4, "message": "Do you want to shop too", "yes": 8, "no": 9 },
             { "node": 5, "message": "Do you mind eating alone", "yes": 10, "no": 11 },
             { "node": 6, "message": "Are you tired", "yes": 12, "no": 13 },
             { "node": 7, "message": "Do you want to drive", "yes": 14, "no": 15 },

// Answers & descriptions
             { "node": 8, "message": "Go to the mall with friends", "yes": 0, "no": 0, "description": "Sounds like you're in the mood to shop and eat, let's go out." },
             { "node": 9, "message": "Hit up a friend for a dinner date", "yes": 0, "no": 0, "description": "Now would be a great opprotunity to connect with an old friend."},
             { "node": 10, "message": "Learn a new dish", "yes": 0, "no": 0 , "description": "Embrace your creative side today and conquer boredom with an impressive new dish"},
             { "node": 11, "message": "Try a new restaurant", "yes": 0, "no": 0 , "description": "Step outside a comfort zone and find a new restaurant to take friends or a date to in the future."},
             { "node": 12, "message": "Take a nap", "yes": 0, "no": 0 , "description": "Sounds like a nap is ideal, there is nothing wrong with some nice rest."},
             { "node": 13, "message": "Take a stroll around a park", "yes": 0, "no": 0 , "description": "Burn off the lethargy with a nice stroll under the sun with some fresh air."},
             { "node": 14, "message": "Watch a movie", "yes": 0, "no": 0 , "description": "Watching a movie sounds ideal.  You get to spend some time outside of home with or without friends and get some lazy entertainment."},
             { "node": 15, "message": "Play video games", "yes": 0, "no": 0 , "description": "If you are feeling lazy yet crave adrenaline, a video game is great."},
];

// this is used for keep track of visted nodes when we test for loops in the tree
var visited;

// This is the intial welcome message
var welcomeMessage = "Are you ready to conquer your boredom?";

// This is the message that is repeated if the response to the initial welcome message is not heard
var repeatWelcomeMessage = "Say yes for suggestions or no to quit.";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "Say yes to continue suggestions, or no to continue being bored.";

// This is the prompt during the game when Alexa doesnt hear or understand a yes / no reply
var promptToSayYesNo = "Say yes or no to continue solving boredom.";

// This is the response to the user after the final question when Alex decides on what group choice the user should be given
var decisionMessage = "I think you should";

// This is the prompt to ask the user if they would like to hear a short description of thier chosen profession or to play again
var playAgainMessage = "Say 'tell me more' to hear a short description about this activity, or do you want to do something else?";

// this is the help message during the setup at the beginning of the game
var helpMessage = "Let's figure out what can solve your boredom. Want to start now?";

// This is the goodbye message when the user has asked to quit the game
var goodbyeMessage = "Ok, see you next time!";

var speechNotFoundMessage = "Could not find speech for node";

var nodeNotFoundMessage = "In nodes array could not find node";

var descriptionNotFoundMessage = "Could not find description for node";

var loopsDetectedMessage = "A repeated path was detected on the node tree, please fix before continuing";

var utteranceTellMeMore = "tell me more";

var utterancePlayAgain = "try again";

// the first node that we will use
var START_NODE = 1;

// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(newSessionHandler, startGameHandlers, askQuestionHandlers, descriptionHandlers);
    alexa.execute();
};

// set state to start up and  welcome the user
var newSessionHandler = {
  'LaunchRequest': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
  },'AMAZON.HelpIntent': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', helpMessage, helpMessage);
  },
  'Unhandled': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', promptToStartMessage, promptToStartMessage);
  }
};


// Called at the start of the game, picks and asks first question for the user
var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'AMAZON.YesIntent': function () {
        // check to see if there are any loops in the node tree - this section can be removed in production code
        visited = [nodes.length];
        var loopFound = helper.debugFunction_walkNode(START_NODE);
        if (loopFound === true) {
             this.emit(':tell', loopsDetectedMessage);
        }
        this.handler.state = states.ASKMODE;
        var message = helper.getSpeechForNode(START_NODE);
        this.attributes.currentNode = START_NODE;
        this.emit(':ask', message, message); // Begin asking questions
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell', goodbyeMessage); // No continue
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
         this.emit(':ask', promptToStartMessage, promptToStartMessage);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpMessage, helpMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', promptToStartMessage, promptToStartMessage);
    }
});


// user will have been asked a question when this intent is called. We want to look at their yes/no
// response and then ask another question. If we have asked more than the requested number of questions Alexa will
// make a choice, inform the user and then ask if they want to play again
var askQuestionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {
    'AMAZON.YesIntent': function () {
        helper.yesOrNo(this,'yes');
    },
    'AMAZON.NoIntent': function () {
         helper.yesOrNo(this, 'no');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    }
});

// user has heard the final choice and has been asked if they want to hear the description or to play again
var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTIONMODE, {

 'AMAZON.YesIntent': function () {
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'DescriptionIntent': function () {
        helper.giveDescription(this);
      },

    'Unhandled': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    }
});

// --------------- Helper Functions  -----------------------

var helper = {

    giveDescription: function (context) {
        var description = helper.getDescriptionForNode(context.attributes.currentNode);
        var message = description + ', ' + repeatWelcomeMessage;
        context.emit(':ask', message, message);
    },

    yesOrNo: function (context, reply) {
        var nextNodeId = helper.getNextNode(context.attributes.currentNode, reply);
        if (nextNodeId == -1) {
            context.handler.state = states.STARTMODE;
            context.emit(':tell', nodeNotFoundMessage, nodeNotFoundMessage);
        }
        var message = helper.getSpeechForNode(nextNodeId);
        if (helper.isAnswerNode(nextNodeId) === true) {
            context.handler.state = states.DESCRIPTIONMODE;
            message = decisionMessage + ' ' + message + ' ,' + playAgainMessage;
        }
        context.attributes.currentNode = nextNodeId;
        context.emit(':ask', message, message);
    },

    // gets the description for the given node id
    getDescriptionForNode: function (nodeId) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                return nodes[i].description;
            }
        }
        return descriptionNotFoundMessage + nodeId;
    },

    // returns the speech for the provided node id
    getSpeechForNode: function (nodeId) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                return nodes[i].message;
            }
        }
        return speechNotFoundMessage + nodeId;
    },

    // checks to see if this node is an choice node or a decision node
    isAnswerNode: function (nodeId) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (nodes[i].yes === 0 && nodes[i].no === 0) {
                    return true;
                }
            }
        }
        return false;
    },

    // gets the next node to traverse to based on the yes no response
    getNextNode: function (nodeId, yesNo) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (yesNo == "yes") {
                    return nodes[i].yes;
                }
                return nodes[i].no;
            }
        }
        return -1; // handles error condition
    },

    // Recursively walks the node tree looking for nodes already visited
    // This method could be changed if you want to implement another type of checking mechanism
    // This should be run on debug builds only not production
    // returns false if node tree path does not contain any previously visited nodes, true if it finds one
    debugFunction_walkNode: function (nodeId) {
        if (helper.isAnswerNode(nodeId) === true) {
            return false;
        }
        if (helper.debugFunction_AddToVisited(nodeId) === false) {
            return true;
        }
        var yesNode = helper.getNextNode(nodeId, "yes");
        var duplicatePathHit = helper.debugFunction_walkNode(yesNode);
        if (duplicatePathHit === true) {
            return true;
        }
        var noNode = helper.getNextNode(nodeId, "no");
        duplicatePathHit = helper.debugFunction_walkNode(noNode);
        if (duplicatePathHit === true) {
            return true;
        }
        return false;
    },

    // checks to see if this node has previously been visited
    // if it has it will be set to 1 in the array and we return false (exists)
    // if it hasnt we set it to 1 and return true (added)
    debugFunction_AddToVisited: function (nodeId) {
        if (visited[nodeId] === 1) {
            return false;
        }
        visited[nodeId] = 1;
        return true;
    }

};
