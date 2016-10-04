(function process(g_request, g_response, g_processor) {

  var json = new global.JSON();

  // Makes the parameters passed to the request easily available
  var params = (function () {
    var names = g_request.getParameterNames(),
        params = {},
        name,
        i;

    while (names.hasMoreElements()) {
      name = names.nextElement();
      params[name] = '' + g_request.getParameter(name);
    }
    if (params.data) {
      params.data = json.decode(params.data);
    }
    return params;
  })();

  var actions = {};

  actions.getImpersonationDetails = function () {
    var result = {};
    result.user_name = gs.getImpersonatingUserName();
    result.is_impersonating = result.user_name !== null;
    return result;
  };

  /**
    summary:
      A simple request handler that takes an action and data object.
    param: action [String]
      A keyword that can be used to determine the request.
    param: data [mixed]
      Arbitrary data object for use with processing.
  **/
  function processAction(params) {
    var start_time = new Date().getTime(),
        action_name = params.action,
        ret = {$success: true},
        errors;

    try {
      if (!action_name) {
        ret.$success = false;
        ret.$error = 'Invalid action.';
      } else if (action_name in actions) {
          ret.result = actions[action_name](params);
          if (ret.result === undefined) {
            ret.$success = false;
            ret.$error = 'Action returned undefined.';
          }
      } else {
        ret.$success = false;
        ret.$error = 'Invalid action name: \'' + action_name + '\'';
      }

      errors = snd_console.get ? snd_console.get({type: 'error'}) : [];
      if (errors.length) {
        ret.$success = false;
        ret.$error = errors.pop();
      }

    } catch (ex) {
      ret.$success = false;
      ret.$error = 'Exception occured. ' + ex.name + ': ' + ex.message;
      if (ex.lineNumber) ret.$error += ' on line ' + ex.lineNumber;
    }

    ret.$time = (new Date().getTime()) - start_time;

    if ('debug_mode' in params && snd_console.getStrings) {
      ret.$snd_console = snd_console.getStrings();
    }

    return ret;
  }

  // process the action that has been requested by the browser
  g_processor.writeOutput('application/json', json.encode(processAction(params)));

})(g_request, g_response, g_processor);