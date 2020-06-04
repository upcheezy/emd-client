with grid_select as (
	select g.id, g.geom
	from grid g
	where st_intersects(g.geom, 'SRID=4326;MULTIPOLYGON(((-81.11445347001491 33.937756260625804, -81.03588665761272 34.12544364580879, -80.87438820989713 34.14290293745372, -80.82201033496234 34.025052718850446, -80.99660325141164 33.93339143771457, -80.99660325141164 33.93339143771457, -81.11445347001491 33.937756260625804)))')
), sa_select as (
	select s.dccode
	from sa_subdivide s
	join grid_select gs on st_intersects (s.geom, gs.geom)
	group by s.dccode
)
select md.*
from member_data md
join sa_select s on md.code = s.dccode;


---------------------------------------------------
------------------data preparation-----------------
---------------------------------------------------

--create table sa_subdivide as
--	select gid,
--	       dccode,
--	       st_subdivide(geom) as geom
--	from serviceareas s ;
--
--alter table sa_subdivide add column id serial not null;
--	
--create unique index sa_subdivide_idx on sa_subdivide (id);
--create index sa_subdivide_gix on sa_subdivide using gist (geom);