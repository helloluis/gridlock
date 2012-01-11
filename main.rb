require 'sinatra'

configure do
	Rack::Mime::MIME_TYPES[".manifest"] = "text/cache-manifest"
end

get '/' do
	redirect '/index.html'
end

set :protection, :except => :frame_options


# require File.dirname(__FILE__) + '/vendor/gems/environment'
# Bundler.require_env

# set :mongo_db, 'db-name'

# All Sinatra options you can set are:

# :mongo_host
# :mongo_db
# :mongo_port
# :mongo_user
# :mongo_password
# Their default values are:

# ENV['MONGOID_HOST']     || 'localhost'
# ENV['MONGOID_DATABASE'] || 'changme'
# ENV['MONGOID_PORT']     || Mongo::Connection::DEFAULT_PORT
# ENV['MONGOID_USERNAME']
# ENV['MONGOID_PASSWORD']

# require 'uri'

# if ENV['MONGOHQ_URL']
#     mongo_uri = URI.parse(ENV['MONGOHQ_URL'])
#     ENV['MONGOID_HOST'] = mongo_uri.host
#     ENV['MONGOID_PORT'] = mongo_uri.port.to_s
#     ENV['MONGOID_USERNAME'] = mongo_uri.user
#     ENV['MONGOID_PASSWORD'] = mongo_uri.password
#     ENV['MONGOID_DATABASE'] = mongo_uri.path.gsub("/", "")
# end