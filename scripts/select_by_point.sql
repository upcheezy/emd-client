with grid_select as (
	select g.id, g.geom
	from grid g
	where st_within('SRID=4326;MULTIPOINT ((-80.90930679318699 33.92029696898087))', g.geom)
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