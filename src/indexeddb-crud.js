'use strict';
// use module pattern
var indexedDBHandler = (function indexedDBHandler() {
  // 5 private property
  var _db;
  var _storeName;

  // init indexedDB
  function init(config, successCallback, failCallback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
      failCallback();
      return 0;
    }
    _storeName = config.storeName; // storage storeName
    _openDB(config, successCallback, failCallback);

    return 0;
  }

  function _openDB(config, successCallback, failCallback) {
    var request = indexedDB.open(config.name, config.version); // open indexedDB

    request.onerror = function _openDBError(e) {
      // window.alert('Pity, fail to load indexedDB. We will offer you the without indexedDB mode');
      window.alert('Something is wrong with indexedDB, we offer you the without DB mode, for more information, checkout console');
      console.log(e.target.error);
      failCallback();
    };
    request.onsuccess = function _openDBSuccess(e) {
      _db = e.target.result;
      successCallback();
      // _getPresentKey();
    };

    // Creating or updating the version of the database
    request.onupgradeneeded = function schemaUp(e) {
      var objectStore;

      _db = e.target.result;
      console.log('onupgradeneeded in');
      if (!(_db.objectStoreNames.contains(_storeName))) {
        objectStore = _db.createObjectStore(_storeName, { keyPath: config.key, autoIncrement: true });
        // Use transaction oncomplete to make sure the objectStore creation is
        objectStore.transaction.oncomplete = function addInitialData() {
          // Store values in the newly created objectStore.
          var storeHander = _transactionGenerator(true);

          try {
            config.initialData.forEach(function addEveryInitialData(data) {
              storeHander.add(data);
            });
          } catch (error) {
            console.log(error);
            window.alert('please set correct initial array object data :)');
          }
        };
      }
    };
  }


  /* CRUD */
  function addItem(newData, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var addOpt = storeHander.add(newData);

    addOpt.onsuccess = function success() {
      console.log('Bravo, success to add one data to indexedDB');
      if (successCallback) { // if has callback been input, execute it
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function getItem(key, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(false);
    var getDataKey = storeHander.get(key);  // get it by index

    getDataKey.onsuccess = function getDataSuccess() {
      console.log('Great, get (key:' + key + '\')s data succeed');
      _successCallbackHandler(successCallback, getDataKey.result, successCallbackArrayParameter);
    };
  }

  // retrieve eligible data (boolean condition)
  function getConditionItem(condition, whether, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();
    var result = []; // use an array to storage eligible data

    storeHander.openCursor(range, 'next').onsuccess = function getConditionItemHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value[condition]) {
            result.push(cursor.value);
          }
        } else if (!whether) {
          if (!cursor.value[condition]) {
            result.push(cursor.value);
          }
        }
        cursor.continue();
      } else {
        _successCallbackHandler(successCallback, result, successCallbackArrayParameter);
      }
    };
  }

  function getAll(successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();
    var result = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        _successCallbackHandler(successCallback, result, successCallbackArrayParameter);
      }
    };
  }

  // update one
  function updateItem(newData, successCallback, successCallbackArrayParameter) {
    // #TODO: update part
    var storeHander = _transactionGenerator(true);
    var putStore = storeHander.put(newData);

    putStore.onsuccess = function updateSuccess() {
      console.log('Aha, modify succeed');
      if (successCallback) {
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function deleteOne(key, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var deleteOpt = storeHander.delete(key);

    deleteOpt.onsuccess = function deleteSuccess() {
      console.log('delete (key: ' + key +  '\')s value succeed');
      if (successCallback) {
        _successCallbackHandler(successCallback, key, successCallbackArrayParameter);
      }
    };
  }

  function clear(successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();

    storeHander.openCursor(range, 'next').onsuccess = function clearHandler(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
        };
        cursor.continue();
      } else if (successCallback) {
        _successCallbackHandler(successCallback, 'all data', successCallbackArrayParameter);
      }
    };
  }

  /* 3 private methods */

  function _transactionGenerator(whetherWrite) {
    var transaction;

    if (whetherWrite) {
      transaction = _db.transaction([_storeName], 'readwrite');
    } else {
      transaction = _db.transaction([_storeName]);
    }

    return transaction.objectStore(_storeName);
  }

  function _rangeGenerator() {
    // if (_initialJSONDataUseful) {
    //   return IDBKeyRange.lowerBound(0);
    // }
    // #FIXME:
    // console.log(_initialJSONDataLen);
    return IDBKeyRange.lowerBound(0, true);
  }

  function _successCallbackHandler(successCallback, result, successCallbackArrayParameter) {
    if (successCallbackArrayParameter) {
      successCallbackArrayParameter.unshift(result);
      successCallback.apply(null, successCallbackArrayParameter);
    } else {
      successCallback(result);
    }
  }

  /* public interface */
  return {
    init: init,
    addItem: addItem,
    getItem: getItem,
    getConditionItem: getConditionItem,
    getAll: getAll,
    updateItem: updateItem,
    removeItem: deleteOne,
    clear: clear
  };
}());

module.exports = indexedDBHandler;
