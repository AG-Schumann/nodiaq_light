var table;

function NewMessage(){
  $.ajax({
    url:'logui/new_log_message',
    type:'post',
    data:{"entry": $("#log_entry_box").val()},
    success:function(){
      UpdateLogTable("#log_table");
      $("#log_entry_box").val("");
    }
  });
}

function CloseOpenErrors(){
  if(!$("#close_error_ack").is(":checked")){
    alert("You must indicate you have at least a vague idea what you're doing. If you don't feel like you have a vague idea what you're doing then what on earth are you doing operating a world-class dark matter detector?");
    return;
  }
  var sensible_thing = $("#sensible_input").val();
  if(!sensible_thing.replace(/\s/g, '').length){
    alert("At least have a decency to write some gibberish in the box. Reminder that we will store your user ID with your gibberish so we can berate you later.");
    return;
  }
  $.ajax({
    url:'logui/acknowledge_errors',
    type:'post',
    data:{"message": sensible_thing}, 
    success:function(){
      UpdateLogTable("#log_table");
      $("#sensible_thing").val("");
      $("#error_modal").modal('hide');
    }
  });
}

function InitializeTable(DOM){
  var STATUS=["DEBUG","MESSAGE","WARNING","ERROR","FATAL", "USER",
    null, null, null, null, null, null,
    "WARNING closed", "ERROR closed", "FATAL closed",
  ];
  var OPENER=["<span style='font-weight:bold;color:black'>",
    "<span style='font-weight:bold;color:blue'>",
    "<span style='font-weight:bold;color:orange'>",
    "<span style='font-weight:bold;color:red'>",
    "<span style='font-weight:bold;color:red'>",
    "<span style='font-weight:bold;color:green'>",
    null, null, null, null, null, null,
    "<span style='font-weight:bold;color:orange'>",
    "<span style='font-weight:bold;color:red'>",
    "<span style='font-weight:bold;color:red'>",
  ];

  // Get the window height minus padding (80px)
  table = new Tabulator(DOM, {
  //$(DOM).tabulator({
    layout:"fitColumns", //fit columns to width of table (optional)
    pagination: "local",
    paginationSize: 24, // magic number based on my screen size
    columns:[ //Define Table Columns
      {title:"Time", field:"time", width: 200},
      {title:"Run ID", field:"runid", hozAlign:"left", width: 100,
        headerFilter: "input", headerFilterPlaceholder: "filter run ID"},
      {title:"User", field:"user", hozAlign:"left", width: 200,
        headerFilter: "input", headerFilterPlaceholder: "filter users"},
      {title:"Message", field:"message", headerFilter: "input",
        headerFilterPlaceholder: "filter messages"},
      {title:"Priority", field:"priority", width: 200,
        formatter:function(cell, formatterParams){
          //cell - the cell component
          //formatterParams - parameters set for the column
          var post = "";
          if(cell.getRow().getData().closing_user != undefined){
            post = " by " + cell.getRow().getData().closing_user;
          }
          var idx = cell.getValue();
          return OPENER[idx] + STATUS[idx] + post + "</span>";
        }},
    ],
    rowClick:function(e, row){ //trigger an alert message when the row is clicked
      if(row.getData().closing_user != undefined){
        alert("Exception closed by " + row.getData().closing_user + " on " + 
          row.getData().closing_date + " with message: " + row.getData().closing_message);

      }
    },
  });
}

function UpdateLogTable(DOM){
  var get_me = "&get_priorities=";
  var checkboxes = {
    "cb_message": 1,
    "cb_open_warning": 2,
    "cb_closed_warning": 12,
    "cb_open_error": 3,
    "cb_closed_error": 13,
    "cb_debug": 0,
    "cb_fatal": 4,
    "cb_user_message": 5,
  }
  for(var key in checkboxes){
    if($("#"+key).is(":checked")){
      get_me+=checkboxes[key].toString()+',';
    }
  }
  get_me = get_me.slice(0, -1); // remove last comma
  table.setData('logui/getMessages?limit=500'+get_me);
}
