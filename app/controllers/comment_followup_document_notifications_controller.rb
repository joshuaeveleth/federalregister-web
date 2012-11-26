class CommentFollowupDocumentNotificationsController < ApplicationController
  def create
    @comment = current_user.comments.first(:conditions => {:comment_tracking_number => params[:comment_tracking_number]})
    @comment.followup_document_notification = true
    @comment.save :validate => false

    respond_to do |format|
      format.json { render :json => { :link_text => t('notifications.links.remove'), 
                                      :method => 'delete',
                                      :description => t('notifications.comment.followup_document.active')} }
    end
  end

  def destroy
    @comment = current_user.comments.first(:conditions => {:comment_tracking_number => params[:comment_tracking_number]})
    @comment.followup_document_notification = false
    @comment.save :validate => false

    respond_to do |format|
      format.json { render :json => { :link_text => t('notifications.links.add'), 
                                      :method => 'post',
                                      :description => t('notifications.comment.followup_document.inactive')} }
    end
  end

end