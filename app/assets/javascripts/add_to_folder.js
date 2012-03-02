function add_items_to_folder(el) {
  var link        = el.find('a');
  var folder_slug = el.data('slug');

  var loader         = link.find('.loader');
  var document_count = link.find('.document_count');
  
  document_count.toggle();
  loader.toggle();

  form = $('form#folder_clippings');
  form_data = form.serializeArray();
  form_data.push( {name: "folder_clippings[folder_slug]", value: folder_slug} );

  $.ajax({
    url: form.prop('action'),
    data: form_data,
    type: "POST"
  }).success( function(response) {
      console.log( 'Response: ', response);

      loader.toggle();
      inner = document_count.find('.document_count_inner');
      inner.html( parseInt(inner.html(), 0) + parseInt(response.folder.doc_count,0) );

      /* update the user add to folder menu with the new counts */
      update_span = $('<span>').addClass('update').html("+" + response.folder.doc_count);
      link.append( update_span );
      update_span.animate({opacity: 1}, 1200);
      
      /* cross fade the update and the count of documents in the folder */
      /* fade out the documents that were moved                         */
      setTimeout(function() {
        update_span.animate({opacity: 0}, 600);
        document_count.css('opacity', 0).show().animate({opacity: 1}, 1200);
        _.each( response.folder.documents, function(doc_id) {
          $("#clippings li[data-doc-id='" + doc_id + "']").animate({opacity: 0}, 600);
        });
      }, 1200);
      
      /* remove the documents that were moved from the dom (after they've faded out */
      setTimeout(function() {
        _.each( response.folder.documents, function(doc_id) {
          $("#clippings li[data-doc-id='" + doc_id + "']").remove();
        });
      }, 1800);
  });

}

function update_clippings_on_page_count(count) {
  count_span = $('div.title span.clippings_on_page_count');
  current_count = parseInt( count_span.html(), 0 );
  count_span.html( current_count - count);
  }

function insert_new_folders_into_clipping_menus(response) {
  if ( $("#add-to-folder-menu-li-template") ) {
    /* generate new folder li and append */
    template = Handlebars.compile( $("#add-to-folder-menu-li-template").html() );
    new_folder_li = $(template(response));
    new_jump_to_folder_li = new_folder_li.clone();

    new_folder_li.css('opacity', 0);
    $('#clipping-actions #add-to-folder .menu ul').append( new_folder_li );

    new_jump_to_folder_li.find('a').attr('href', "/my/folders/"+response.folder.slug);
    $('#clipping-actions #jump-to-folder .menu ul').append( new_jump_to_folder_li );
    
    /* toggle the document count and place the update span in its place */
    link = new_folder_li.find('a');
    document_count = link.find('.document_count');
    document_count.toggle();
    
    update_span = $('<span>').addClass('update').html("+" + response.folder.doc_count).css('opacity', 1);
    link.append( update_span );

    /* fade in the new folder li */
    new_folder_li.animate({opacity: 1}, 1200);

    /* cross fade the update and the count of documents in the folder */
    setTimeout(function () {
      update_span.animate({opacity: 0}, 600);
      document_count.css('opacity', 0).show().animate({opacity: 1}, 1200);
    }, 1500);
  }
}

function create_new_folder_with_items( form, clipping_ids ) {
  /* hide the form so we can show status messages */
  form.hide();
  form.siblings('p').hide();

  /* show creating folder message and loader */
  $('new-folder-modal .folder_create').show();

  /* submit data and handle response or failure */
  form_data = form.serializeArray();
  form_data.push( {name: "folder[clipping_ids]", value: clipping_ids} );

  $.ajax({
      url: form.prop('action'),
      data: form_data,
      type: "POST"
    }).success(function(response) {
        $('new-folder-modal .folder_create').hide();
        show_folder_success(response);

        /* hide the modal about 1 second after success */
        setTimeout(function () {
            $('#new-folder-modal').jqmHide();
            $('#new-folder-modal .folder_success').hide();
            form.siblings('p').show();
            form.find('input#folder_name').val('');
            form.show();
          },
          800);
        
        setTimeout(function() {
            /* insert the newly created folder */
            insert_new_folders_into_clipping_menus(response);
          },
          1025);

        setTimeout(function() {
            /* remove from the current view the clippings that were added to the new folder */
            _.each( response.folder.documents, function(doc_id) {
              $("#clippings li[data-doc-id='" + doc_id + "']").animate({opacity: 0}, 600);
            });
          },
          3725);

        /* remove the documents that were moved from the dom (after they've faded out */
        setTimeout(function() {
            _.each( response.folder.documents, function(doc_id) {
              $("#clippings li[data-doc-id='" + doc_id + "']").remove();
            });
            
            update_clippings_on_page_count( response.folder.doc_count );
          },
          4325);

        /* close the menu and return page state to normal once the new folder animation is complete */
        setTimeout(function() {
            $('#clipping-actions').delegate( '#clipping-actions #add-to-folder', 'mouseleave', function() {
              hide_clipping_menu( $(this) );
            });
            $('#clipping-actions #add-to-folder').removeClass('hover');
            $('#clipping-actions div.menu li#new-folder').removeClass('hover');


            hide_clipping_menu( $('#clipping-actions #add-to-folder') );
          },
          4725);
      })
      .fail( function(response) {
        $('new-folder-modal .folder_create').hide();
        form.siblings('p').show();
        form.show();
      });
}

$(document).ready(function() {
  /* save clippings to already created folder */
  $('div#add-to-folder .menu li:not(#new-folder)').live('click', function(event) {
    event.preventDefault();
    add_items_to_folder( $(this) );
  });

  /* new folder creation */
  $('#add-to-folder .menu li#new-folder').live('click', function(event) {
    event.preventDefault();
    
    /* disable the hover menu and keep open */
    $('#clipping-actions').undelegate('#clipping-actions #add-to-folder', 'mouseleave');
    $('#clipping-actions #add-to-folder').addClass('hover');
    $('#clipping-actions div.menu li#new-folder').addClass('hover');

    /* decide which modal to show */
    if ( expect_logged_in() ) {
      el = $('#new-folder-modal');
    } else {
      el = $('#account-needed-modal');
    }
    
    if ( el.is('#new-folder-modal') ) {
      el.find('p.instructions span#fyi').html('When this folder is created any selected items will be moved to it.');
    }

    /* show the modal */
    $(el).jqm({
        modal: true,
        toTop: true,
        onShow: myfr2_jqmHandlers.show,
        onHide: myfr2_jqmHandlers.hide
    });
    el.centerScreen().jqmShow();
  });

  $('#new-folder-modal form.folder').live('submit', function(event) {
    event.preventDefault();

    clipping_ids = _.map( $('form#folder_clippings input:checked'), function(input) { 
                      return $(input).closest('li').data('doc-id'); 
                   });
    create_new_folder_with_items( $(this), clipping_ids );
  });

  $("#new-folder-modal .new_folder_close").bind('click', function (event) {
    /* re-enable our hover menu that was disabled when the 'new folder' button was clicked */
    $('#clipping-actions').delegate( '#clipping-actions #add-to-folder', 'mouseleave', function() {
      hide_clipping_menu( $(this) );
    });

    /* close the hover menu */
    hide_clipping_menu( $('#clipping-actions #add-to-folder') );
    $('#clipping-actions #add-to-folder').removeClass('hover');
    $('#clipping-actions div.menu li#new-folder').removeClass('hover');
  });
});
