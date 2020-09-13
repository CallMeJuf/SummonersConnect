//Define my module
var sc = angular.module('sc', []);
sc.factory('tableFactory', function($http){
    return { tableData: {data: false, error: false, matchURL: false},
             };
});

sc.factory('matchURLFactory', function(){
    return function(server) {switch (server){
        case "NA": 
            return "http://matchhistory.na.leagueoflegends.com/en/#match-details/NA1/";
        case "EUNE": 
            return "http://matchhistory.eune.leagueoflegends.com/en/#match-details/EUN1/";
        case "EUW":
            return "http://matchhistory.euw.leagueoflegends.com/en/#match-details/EUW1/";
        case "RU": 
            return "http://matchhistory.ru.leagueoflegends.com/ru/#match-details/RU/";
        case "KR": 
            return "http://matchhistory.leagueoflegends.co.kr/ko/#match-details/KR/";
        case "TR": 
            return "http://matchhistory.tr.leagueoflegends.com/tr/#match-details/TR1/";
        case "BR": 
            return "http://matchhistory.br.leagueoflegends.com/pt/#match-details/BR1/";
        case "OCE": 
            return "http://matchhistory.oce.leagueoflegends.com/en/#match-details/OC1/";
        case "JP":  
            return "http://matchhistory.jp.leagueoflegends.com/ja/#match-details/JP1/";
        case "LAN": 
            return "http://matchhistory.lan.leagueoflegends.com/es/#match-details/LA1/";
        case "LAS":
            return "http://matchhistory.las.leagueoflegends.com/es/#match-details/LA2/";
        default:
            return "http://matchhistory.na.leagueoflegends.com/en/#match-details/NA1/";
    }
    }
})

sc.factory('champFactory', function($http){
    return function () {
        return $http.get('/json/champs.json');
    };
})

sc.factory('queueFactory', function($http){
    return function () {
        return $http.get('https://static.developer.riotgames.com/docs/lol/queues.json');
    };
})

//Define Controller and scope for input form
sc.controller('inputForm', function($scope, $http, tableFactory, matchURLFactory) {
    //Set to true when update is requested.
    var updating = false;
    // Get serverlist info and assign to servers variable.
    $http.get('/json/serverlist.json').then(function res(response){
        $scope.servers = {'selectedServer': 'NA' , 'servers': response.data};
    }, 
    function err(){
        $scope.servers = ["NA","EUW","EUNE", "KR"]
    });
    //Called when search button is pressed.
    $scope.getTableData = function(s1,s2,server){
            updating = false;
            tableFactory.tableData.data = false;
            tableFactory.tableData.error = false;
            //this.tableData = summoner1 + " " + summoner2 + " " + server;
            //Get serverlist info and assign to servers variable.
            $http.get('/api/'+ server +'/'+ s1 + '-' + s2).then(function res(response){

                if(response.data.matches && response.data.matches.length != 0){
                    tableFactory.tableData.data = response.data.matches;
                    tableFactory.tableData.matchURL = matchURLFactory(server)
                }
                if(response.data.error)
                    tableFactory.tableData.error = response.data.error;
                $scope.summoner1Updated = response.data.summoner1Date;
                $scope.summoner2Updated = response.data.summoner2Date;
                $scope.update = response.data.update;
            }, 
            function err(error){
                if(error.status == 400){
                    tableFactory.tableData.error = "Invalid Characters in Summoner Name";
                }
            });

    };
    //Sends a request to update summoners then starts isUpdating to monitor status
    $scope.updateSummoners = function() {
        var server = $scope.servers.selectedServer;
        tableFactory.tableData.data = false;
        tableFactory.tableData.error = false;
        updating = true;
        $http.get('/api/'+ server +'/'+ $scope.summoner1Name + '-' + $scope.summoner2Name + '/update').then(function res(response){
            setTimeout($scope.isUpdating, 3000, $scope.summoner1Name, $scope.summoner2Name, $scope.servers.selectedServer);
        }, 
        function err(error){
            updating = false;
            console.log(error);
        });
    }

    //Checks status of summoners in update queue
    $scope.isUpdating = function(s1,s2,server){
        if(updating == false)
            return
        $http.get('/api/'+ server +'/'+ s1 + '-' + s2 + '/updating').then(function res(response){
            if(response.data == 0){
                updating = false;
                $scope.getTableData(s1,s2,server);
            }else{
                setTimeout($scope.isUpdating, 3000, s1,s2,server);
            }
        }, 
        function err(error){
            updating = false;
            console.log(error);
        });

    }
    $scope.isNumber = function(val) {
        return typeof val === 'number';
    }
    
    $scope.getServerList = function(){
        return "html/serverlist.html";
    };

    $scope.getUpdateButton = function(){
        if(updating)
            return "html/updatingbutton.html";
        return ($scope.update) ? "html/updatebutton.html" : "";
    };
});

//Assigns data for compare table and handles sorting of table
sc.controller('compareTable', function($scope, tableFactory, champFactory, queueFactory){
    $scope.tableData = tableFactory.tableData;

    champFactory().then(function (response){
        $scope.champs = response.data;
    })
    
    queueFactory().then(function (response){
        $scope.queues = response.data.map( queue => { 
            queue.description = queue.description ? queue.description.replace(/ games$/, '') : queue.map;
            return queue;
        });
    })

    //Gets compareTable and adds champname/url from id.
    $scope.getCompareTable = function(){
        if($scope.tableData.data){
            for(var i = 0; i < Object.keys($scope.tableData.data).length; i++){
                $scope.tableData.data[i].localtimestamp = new Date($scope.tableData.data[i].timestamp).toLocaleString(navigator.language);
                $scope.tableData.data[i].summoner1ChampName = $scope.champs[$scope.tableData.data[i].summoner1ChampId].name;
                $scope.tableData.data[i].summoner2ChampName = $scope.champs[$scope.tableData.data[i].summoner2ChampId].name;
                $scope.tableData.data[i].summoner1ChampURL = $scope.champs[$scope.tableData.data[i].summoner1ChampId].URL;
                $scope.tableData.data[i].summoner2ChampURL = $scope.champs[$scope.tableData.data[i].summoner2ChampId].URL;
                let queueType = $scope.queues.find( queue => queue.queueId == $scope.tableData.data[i].gameType );
                $scope.tableData.data[i].gameType = queueType ? queueType.description : ( isNaN($scope.tableData.data[i].gameType) ? $scope.tableData.data[i].gameType : `Unknown` );
            }
            return "html/compareTable.html";
        }else if($scope.tableData.error){
            return "html/error.html";
        }else{
            return "";
        }
    };


    $scope.sortBy = function(sortProperty){
        $scope.reverse = ($scope.sortProperty === sortProperty) ? !$scope.reverse : false;
        $scope.sortProperty = sortProperty;
    }

});
